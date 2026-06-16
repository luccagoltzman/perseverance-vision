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

/** Garante o path /ws exigido pelo servidor. */
function normalizeWsUrl(url: string): string {
  const trimmed = url.replace(/\/$/, '');
  if (trimmed.endsWith('/ws')) return trimmed;
  return `${trimmed}/ws`;
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
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;

      const timeout = window.setTimeout(() => {
        reject(new Error('Tempo esgotado ao conectar ao servidor multiplayer.'));
        ws.close();
      }, 8000);

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
          window.clearTimeout(timeout);
          this.myId = msg.id;
          this.emit('onWelcome', msg.id, msg.players);
          this.emit('onOnlineCount', msg.online);
          resolve();
          return;
        }

        if (msg.type === 'error') {
          window.clearTimeout(timeout);
          reject(new Error(msg.message));
          ws.close();
          return;
        }

        this.handleMessage(msg);
      };

      ws.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Não foi possível conectar ao servidor multiplayer.'));
      };

      ws.onclose = () => {
        this.emit('onConnectionChange', false);
        if (this.myId) {
          this.myId = null;
        }
      };
    });
  }

  /** Consulta quantos jogadores estão online sem entrar na sala. */
  peekOnlineCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = getMultiplayerWsUrl();
      const ws = new WebSocket(url);
      const timeout = window.setTimeout(() => {
        ws.close();
        reject(new Error('offline'));
      }, 4000);

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'ping' } satisfies ClientMessage));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as ServerMessage;
          if (msg.type === 'online') {
            window.clearTimeout(timeout);
            ws.close();
            resolve(msg.count);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('offline'));
      };
    });
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
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
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
