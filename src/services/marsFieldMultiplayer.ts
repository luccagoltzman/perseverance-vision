import type {
  ClientMessage,
  FieldChatMessage,
  FieldPlayerState,
  ServerMessage,
} from '@/types/multiplayer';

const STORAGE_KEY = 'mars-field-name';

export function getStoredFieldName(): string {
  return sessionStorage.getItem(STORAGE_KEY)?.trim() ?? '';
}

export function storeFieldName(name: string): void {
  sessionStorage.setItem(STORAGE_KEY, name.trim());
}

export function getMultiplayerWsUrl(): string {
  const env = import.meta.env.VITE_MULTIPLAYER_WS_URL?.trim();
  if (env) return normalizeWsUrl(env);

  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws`;
}

/** Garante o path /ws e wss em páginas HTTPS (Vercel). */
function normalizeWsUrl(url: string): string {
  let trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed.endsWith('/ws')) trimmed = `${trimmed}/ws`;

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    trimmed = trimmed.replace(/^ws:\/\//i, 'wss://');
  }

  return trimmed;
}

/** URL HTTP do servidor (health check) a partir da URL do WebSocket. */
function getMultiplayerHttpUrl(): string {
  const ws = getMultiplayerWsUrl();
  return ws
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://')
    .replace(/\/ws$/i, '');
}

export interface MultiplayerCallbacks {
  onWelcome?: (id: string, players: FieldPlayerState[]) => void;
  onPlayerJoined?: (player: FieldPlayerState) => void;
  onPlayerLeft?: (id: string) => void;
  onPlayerState?: (state: FieldPlayerState) => void;
  onChat?: (message: FieldChatMessage) => void;
  onOnlineCount?: (count: number) => void;
  onError?: (message: string) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class MarsFieldMultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners: MultiplayerCallbacks[] = [];
  private lastSend = 0;
  private myId: string | null = null;
  private waveUntil = 0;

  addCallbacks(callbacks: MultiplayerCallbacks): () => void {
    this.listeners.push(callbacks);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callbacks);
    };
  }

  setCallbacks(callbacks: MultiplayerCallbacks): void {
    this.listeners = [callbacks];
  }

  private emit<K extends keyof MultiplayerCallbacks>(
    key: K,
    ...args: Parameters<NonNullable<MultiplayerCallbacks[K]>>
  ): void {
    for (const listener of this.listeners) {
      const fn = listener[key];
      if (typeof fn === 'function') {
        (fn as (...a: unknown[]) => void)(...args);
      }
    }
  }

  get id(): string | null {
    return this.myId;
  }

  async connect(name: string): Promise<void> {
    this.disconnect();
    storeFieldName(name);

    const url = getMultiplayerWsUrl();
    const maxAttempts = 3;
    let lastError: Error = new Error('Não foi possível conectar ao servidor multiplayer.');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.connectOnce(name, url, attempt === 1 ? 12000 : 20000);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : lastError;
        this.disconnect();
        if (attempt < maxAttempts) {
          await sleep(1500 * attempt);
        }
      }
    }

    throw new Error(
      `${lastError.message} Verifique se o servidor Fly está no ar (${url}).`,
    );
  }

  private connectOnce(name: string, url: string, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        fn();
      };

      const timeout = window.setTimeout(() => {
        finish(() => {
          reject(new Error('Tempo esgotado ao conectar (servidor pode estar acordando).'));
          if (ws.readyState === WebSocket.CONNECTING) ws.close();
        });
      }, timeoutMs);

      ws.onopen = () => {
        this.emit('onConnectionChange', true);
        ws.send(JSON.stringify({ type: 'join', name } satisfies ClientMessage));
      };

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }

        if (msg.type === 'welcome') {
          finish(() => {
            this.myId = msg.id;
            this.emit('onWelcome', msg.id, msg.players);
            this.emit('onOnlineCount', msg.online);
            resolve();
          });
          return;
        }

        if (msg.type === 'error') {
          finish(() => {
            reject(new Error(msg.message));
            ws.close();
          });
          return;
        }

        this.handleMessage(msg);
      };

      ws.onerror = () => {
        finish(() => reject(new Error('Falha na conexão WebSocket com o servidor.')));
      };

      ws.onclose = (event) => {
        this.emit('onConnectionChange', false);
        if (!settled) {
          finish(() =>
            reject(
              new Error(
                event.code === 1006
                  ? 'Conexão recusada ou servidor offline.'
                  : `Conexão encerrada (código ${event.code}).`,
              ),
            ),
          );
        } else if (this.myId) {
          this.myId = null;
        }
      };
    });
  }

  /** Consulta jogadores online via HTTP (evita abrir WebSocket só para contar). */
  async peekOnlineCount(): Promise<number> {
    const httpUrl = getMultiplayerHttpUrl();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(httpUrl, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('offline');
      const text = await res.text();
      const match = text.match(/(\d+)\s+explorador/i);
      return match ? Number(match[1]) : 0;
    } catch {
      throw new Error('offline');
    } finally {
      window.clearTimeout(timeout);
    }
  }

  sendState(state: {
    x: number;
    z: number;
    y: number;
    yaw: number;
    sprint: boolean;
    moving: boolean;
  }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const now = performance.now();
    if (now - this.lastSend < 50) return;
    this.lastSend = now;

    const payload: ClientMessage = {
      type: 'state',
      ...state,
      waveUntil: this.waveUntil,
    };
    this.ws.send(JSON.stringify(payload));
  }

  sendChat(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'chat', text } satisfies ClientMessage));
  }

  wave(): void {
    this.waveUntil = Date.now() + 1800;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'wave' } satisfies ClientMessage));
  }

  disconnect(): void {
    if (this.ws) {
      const ws = this.ws;
      this.ws = null;
      ws.onclose = null;
      ws.onerror = null;
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener('open', () => ws.close(), { once: true });
      }
    }
    this.myId = null;
    this.waveUntil = 0;
    this.emit('onConnectionChange', false);
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'player_joined':
        this.emit('onPlayerJoined', msg.player);
        this.emit('onOnlineCount', msg.online);
        break;
      case 'player_left':
        this.emit('onPlayerLeft', msg.id);
        this.emit('onOnlineCount', msg.online);
        break;
      case 'state':
        this.emit('onPlayerState', {
          id: msg.id,
          name: '',
          x: msg.x,
          z: msg.z,
          y: msg.y,
          yaw: msg.yaw,
          sprint: msg.sprint,
          moving: msg.moving,
          waveUntil: msg.waveUntil,
        });
        break;
      case 'chat':
        this.emit('onChat', {
          id: msg.id,
          name: msg.name,
          text: msg.text,
          ts: msg.ts,
        });
        break;
      case 'online':
        this.emit('onOnlineCount', msg.count);
        break;
      default:
        break;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
