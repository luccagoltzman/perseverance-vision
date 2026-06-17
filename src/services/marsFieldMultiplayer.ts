import type {
  CaptureMatchState,
  ClientMessage,
  FieldChatMessage,
  FieldPlayerState,
  FieldTeam,
  LocalCombatState,
  RoverSpotState,
  ServerFeatures,
  ServerMessage,
} from '@/types/multiplayer';
import { MAX_HP, SHOOT_COOLDOWN_MS } from '@/constants/fieldCombat';
import { NEARBY_INDICATOR_RADIUS } from '@/constants/fieldSocial';

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

function normalizeWsUrl(url: string): string {
  let trimmed = url.trim().replace(/\/$/, '');
  if (!trimmed.endsWith('/ws')) trimmed = `${trimmed}/ws`;

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    trimmed = trimmed.replace(/^ws:\/\//i, 'wss://');
  }

  return trimmed;
}

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
  onCombatChange?: (state: LocalCombatState) => void;
  onLaserShot?: (id: string, x: number, z: number, y: number, yaw: number) => void;
  onPlayerHit?: (victimId: string, attackerId: string, hp: number, damage: number) => void;
  onPlayerDied?: (id: string, respawnAt: number, killerId: string | null) => void;
  onPlayerRespawned?: (player: FieldPlayerState) => void;
  onLocalRespawn?: (player: FieldPlayerState) => void;
  onCaptureUpdate?: (capture: CaptureMatchState) => void;
  onCaptureEnded?: (capture: CaptureMatchState) => void;
  onRoverSpots?: (spots: RoverSpotState[]) => void;
  onSatellitePass?: (durationMs: number, azimuth: number) => void;
  onProximityChat?: (message: FieldChatMessage) => void;
  onNearbyCountChange?: (count: number) => void;
  onServerFeatures?: (features: ServerFeatures | null) => void;
}

const DEFAULT_COMBAT: LocalCombatState = {
  hp: MAX_HP,
  alive: true,
  laserEquipped: false,
  respawnAt: 0,
};

export function createDefaultCombatState(): LocalCombatState {
  return { ...DEFAULT_COMBAT };
}

function normalizeCombatState(partial?: Partial<LocalCombatState>): LocalCombatState {
  return {
    hp: partial?.hp ?? DEFAULT_COMBAT.hp,
    alive: partial?.alive ?? DEFAULT_COMBAT.alive,
    laserEquipped: partial?.laserEquipped ?? DEFAULT_COMBAT.laserEquipped,
    respawnAt: partial?.respawnAt ?? DEFAULT_COMBAT.respawnAt,
  };
}

export class MarsFieldMultiplayerClient {
  private ws: WebSocket | null = null;
  private listeners: MultiplayerCallbacks[] = [];
  private lastSend = 0;
  private myId: string | null = null;
  private waveUntil = 0;
  private lastLocalShot = 0;
  private combat: LocalCombatState = { ...DEFAULT_COMBAT };
  private playerNames = new Map<string, string>();
  private remoteStates = new Map<string, FieldPlayerState>();
  private localPos = { x: 0, z: 0 };
  private capture: CaptureMatchState | null = null;
  private roverSpotState: RoverSpotState[] = [];
  private myTeam: FieldTeam | null = null;
  private serverFeatures: ServerFeatures | null = null;

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

  get combatState(): LocalCombatState {
    return this.combat;
  }

  get team(): FieldTeam | null {
    return this.myTeam;
  }

  get supportsCombat(): boolean {
    return this.serverFeatures?.combat ?? false;
  }

  get features(): ServerFeatures | null {
    return this.serverFeatures;
  }

  get captureState(): CaptureMatchState | null {
    return this.capture;
  }

  get roverSpots(): RoverSpotState[] {
    return this.roverSpotState;
  }

  getOccupiedRoverIds(): Set<string> {
    const occupied = new Set<string>();
    for (const state of this.remoteStates.values()) {
      if (state.roverId) occupied.add(state.roverId);
    }
    return occupied;
  }

  getKnownPlayers(): FieldPlayerState[] {
    return [...this.remoteStates.values()];
  }

  updateLocalPosition(x: number, z: number): void {
    this.localPos = { x, z };
    this.emit('onNearbyCountChange', this.getNearbyCount());
  }

  getNearbyCount(radius = NEARBY_INDICATOR_RADIUS): number {
    const radiusSq = radius * radius;
    let count = 0;
    for (const state of this.remoteStates.values()) {
      const dx = state.x - this.localPos.x;
      const dz = state.z - this.localPos.z;
      if (dx * dx + dz * dz <= radiusSq) count++;
    }
    return count;
  }

  getPlayerName(id: string): string {
    return this.playerNames.get(id) ?? '';
  }

  private rememberName(id: string, name?: string): void {
    const trimmed = name?.trim();
    if (trimmed) this.playerNames.set(id, trimmed);
  }

  private enrichState(state: FieldPlayerState): FieldPlayerState {
    if (state.name?.trim()) this.rememberName(state.id, state.name);
    const name = this.playerNames.get(state.id) ?? state.name ?? '';
    return { ...state, name, team: state.team ?? 'alpha', roverId: state.roverId ?? null };
  }

  private setCombat(next?: Partial<LocalCombatState>): void {
    this.combat = normalizeCombatState(next);
    this.emit('onCombatChange', this.combat);
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
            this.myTeam = msg.team ?? null;
            this.capture = msg.capture ?? null;
            this.roverSpotState = msg.roverSpots ?? [];
            this.serverFeatures =
              msg.features ??
              (msg.self ? { combat: true, capture: Boolean(msg.capture), rovers: Boolean(msg.roverSpots) } : null);
            this.rememberName(msg.id, name);
            for (const player of msg.players) {
              this.rememberName(player.id, player.name);
              this.remoteStates.set(player.id, this.enrichState(this.normalizePlayerState(player)));
            }
            this.setCombat(msg.self ?? createDefaultCombatState());
            this.emit('onWelcome', msg.id, msg.players.map((p) => this.enrichState(this.normalizePlayerState(p))));
            this.emit('onOnlineCount', msg.online);
            if (msg.capture) this.emit('onCaptureUpdate', msg.capture);
            if (msg.roverSpots) this.emit('onRoverSpots', msg.roverSpots);
            this.emit('onServerFeatures', this.serverFeatures);
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

  sendState(
    state: {
      x: number;
      z: number;
      y: number;
      yaw: number;
      sprint: boolean;
      moving: boolean;
      inRover: boolean;
      roverId?: string | null;
      laserEquipped?: boolean;
    },
    options?: { force?: boolean },
  ): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.combat.alive) return;

    const now = performance.now();
    if (!options?.force && now - this.lastSend < 50) return;
    this.lastSend = now;

    const payload: ClientMessage = {
      type: 'state',
      ...state,
      roverId: state.roverId ?? null,
      laserEquipped: state.laserEquipped ?? this.combat.laserEquipped,
      waveUntil: this.waveUntil,
    };
    this.ws.send(JSON.stringify(payload));
  }

  sendChat(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'chat', text } satisfies ClientMessage));
  }

  wave(): void {
    if (!this.combat.alive) return;
    this.waveUntil = Date.now() + 1800;
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'wave' } satisfies ClientMessage));
  }

  shoot(): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    if (!this.combat.alive || !this.combat.laserEquipped) return false;

    const now = Date.now();
    if (now - this.lastLocalShot < SHOOT_COOLDOWN_MS) return false;
    this.lastLocalShot = now;

    this.ws.send(JSON.stringify({ type: 'shoot', laserEquipped: true } satisfies ClientMessage));
    return true;
  }

  equipLaser(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (!this.combat.alive) return;
    this.setCombat({ ...this.combat, laserEquipped: true });
    this.ws.send(JSON.stringify({ type: 'equip_laser' } satisfies ClientMessage));
  }

  stowLaser(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.setCombat({ ...this.combat, laserEquipped: false });
    this.ws.send(JSON.stringify({ type: 'stow_laser' } satisfies ClientMessage));
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
    this.lastLocalShot = 0;
    this.playerNames.clear();
    this.remoteStates.clear();
    this.capture = null;
    this.roverSpotState = [];
    this.serverFeatures = null;
    this.myTeam = null;
    this.combat = { ...DEFAULT_COMBAT };
    this.emit('onConnectionChange', false);
  }

  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'player_joined': {
        const player = this.enrichState(this.normalizePlayerState(msg.player));
        this.remoteStates.set(player.id, player);
        this.emit('onPlayerJoined', player);
        this.emit('onOnlineCount', msg.online);
        this.emit('onNearbyCountChange', this.getNearbyCount());
        break;
      }
      case 'player_left':
        this.remoteStates.delete(msg.id);
        this.emit('onPlayerLeft', msg.id);
        this.emit('onOnlineCount', msg.online);
        this.emit('onNearbyCountChange', this.getNearbyCount());
        break;
      case 'state': {
        const state = this.enrichState(this.parsePlayerState(msg));
        this.remoteStates.set(state.id, state);
        if (msg.id === this.myId) {
          this.setCombat({
            hp: msg.hp,
            alive: msg.alive,
            laserEquipped:
              typeof msg.laserEquipped === 'boolean' ? msg.laserEquipped : this.combat.laserEquipped,
            respawnAt: msg.respawnAt,
          });
        }
        this.emit('onPlayerState', state);
        this.emit('onNearbyCountChange', this.getNearbyCount());
        break;
      }
      case 'laser_shot':
        this.emit('onLaserShot', msg.id, msg.x, msg.z, msg.y, msg.yaw);
        break;
      case 'player_hit':
        if (msg.victimId === this.myId) {
          this.setCombat({
            ...this.combat,
            hp: msg.hp,
            alive: msg.hp > 0,
          });
        }
        this.emit('onPlayerHit', msg.victimId, msg.attackerId, msg.hp, msg.damage);
        break;
      case 'player_died':
        if (msg.id === this.myId) {
          this.setCombat({
            hp: 0,
            alive: false,
            laserEquipped: false,
            respawnAt: msg.respawnAt,
          });
        }
        this.emit('onPlayerDied', msg.id, msg.respawnAt, msg.killerId);
        break;
      case 'player_respawned': {
        const player = this.enrichState(msg.player);
        if (player.id === this.myId) {
          this.setCombat({
            hp: player.hp,
            alive: true,
            laserEquipped: false,
            respawnAt: 0,
          });
          this.emit('onLocalRespawn', player);
        }
        this.emit('onPlayerRespawned', player);
        this.emit('onPlayerState', player);
        break;
      }
      case 'chat': {
        const message: FieldChatMessage = {
          id: msg.id,
          name: msg.name,
          text: msg.text,
          ts: msg.ts,
          scope: msg.scope,
          x: msg.x,
          z: msg.z,
        };
        this.emit('onChat', message);
        if (msg.scope === 'proximity') {
          this.emit('onProximityChat', message);
        }
        break;
      }
      case 'capture_update':
        this.capture = msg.capture;
        this.emit('onCaptureUpdate', msg.capture);
        break;
      case 'capture_ended':
        this.capture = msg.capture;
        this.emit('onCaptureUpdate', msg.capture);
        this.emit('onCaptureEnded', msg.capture);
        break;
      case 'rover_spots':
        this.roverSpotState = msg.spots;
        this.emit('onRoverSpots', msg.spots);
        break;
      case 'satellite_pass':
        this.emit('onSatellitePass', msg.durationMs, msg.azimuth);
        break;
      case 'online':
        this.emit('onOnlineCount', msg.count);
        break;
      default:
        break;
    }
  }

  private normalizePlayerState(raw: FieldPlayerState): FieldPlayerState {
    return {
      id: raw.id,
      name: raw.name ?? '',
      team: raw.team ?? 'alpha',
      x: raw.x ?? 0,
      z: raw.z ?? 8,
      y: raw.y ?? 0,
      yaw: raw.yaw ?? Math.PI,
      sprint: raw.sprint ?? false,
      moving: raw.moving ?? false,
      waveUntil: raw.waveUntil ?? 0,
      inRover: raw.inRover ?? false,
      roverId: raw.roverId ?? null,
      hp: raw.hp ?? MAX_HP,
      alive: raw.alive ?? true,
      laserEquipped: raw.laserEquipped ?? false,
      respawnAt: raw.respawnAt ?? 0,
    };
  }

  private parsePlayerState(msg: Extract<ServerMessage, { type: 'state' }>): FieldPlayerState {
    return {
      id: msg.id,
      name: msg.name ?? '',
      team: msg.team ?? 'alpha',
      x: msg.x,
      z: msg.z,
      y: msg.y,
      yaw: msg.yaw,
      sprint: msg.sprint,
      moving: msg.moving,
      waveUntil: msg.waveUntil,
      inRover: msg.inRover ?? false,
      roverId: msg.roverId ?? null,
      hp: msg.hp ?? MAX_HP,
      alive: msg.alive ?? true,
      laserEquipped: msg.laserEquipped ?? false,
      respawnAt: msg.respawnAt ?? 0,
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
