import type { WebSocket } from 'ws';

export type FieldTeam = 'alpha' | 'beta';
export type CaptureZoneId = 'zone-a' | 'zone-b';

export const CAPTURE_ZONE_RADIUS = 5.5;
export const CAPTURE_MATCH_MS = 180_000;
export const CAPTURE_RESTART_MS = 15_000;
export const CAPTURE_TICK_MS = 1000;
export const CAPTURE_MIN_PLAYERS = 2;
export const PROXIMITY_CHAT_RADIUS = 22;
export const SATELLITE_MIN_INTERVAL_MS = 240_000;
export const SATELLITE_MAX_INTERVAL_MS = 420_000;
export const SATELLITE_DURATION_MS = 12_000;

export const CAPTURE_ZONES = [
  { id: 'zone-a' as const, label: 'Relay Alpha', x: -32, z: -18 },
  { id: 'zone-b' as const, label: 'Relay Beta', x: 28, z: 22 },
];

export interface CapturePlayer {
  id: string;
  name: string;
  team: FieldTeam;
  ws: WebSocket;
  x: number;
  z: number;
  alive: boolean;
  inRover: boolean;
}

export interface CaptureZoneState {
  id: CaptureZoneId;
  label: string;
  x: number;
  z: number;
  radius: number;
  alphaSec: number;
  betaSec: number;
  status: 'neutral' | FieldTeam | 'contested';
  hackersAlpha: number;
  hackersBeta: number;
}

export interface CaptureMatchState {
  phase: 'idle' | 'active' | 'ended';
  endsAt: number;
  zones: CaptureZoneState[];
  scores: { alpha: number; beta: number };
  winner: FieldTeam | 'draw' | null;
}

function createInitialCapture(): CaptureMatchState {
  return {
    phase: 'idle',
    endsAt: 0,
    zones: CAPTURE_ZONES.map((z) => ({
      id: z.id,
      label: z.label,
      x: z.x,
      z: z.z,
      radius: CAPTURE_ZONE_RADIUS,
      alphaSec: 0,
      betaSec: 0,
      status: 'neutral',
      hackersAlpha: 0,
      hackersBeta: 0,
    })),
    scores: { alpha: 0, beta: 0 },
    winner: null,
  };
}

let captureState = createInitialCapture();
let captureRestartTimer: ReturnType<typeof setTimeout> | null = null;

export function getCaptureState(): CaptureMatchState {
  return captureState;
}

export function assignTeam(players: Iterable<CapturePlayer>): FieldTeam {
  let alpha = 0;
  let beta = 0;
  for (const p of players) {
    if (p.team === 'alpha') alpha++;
    else beta++;
  }
  return alpha <= beta ? 'alpha' : 'beta';
}

function resetCaptureZones(): void {
  captureState = {
    ...createInitialCapture(),
    phase: 'active',
    endsAt: Date.now() + CAPTURE_MATCH_MS,
  };
}

function endCapture(): void {
  const { alpha, beta } = captureState.scores;
  captureState.phase = 'ended';
  captureState.winner = alpha === beta ? 'draw' : alpha > beta ? 'alpha' : 'beta';
}

export function startCaptureIfReady(
  playerCount: number,
  broadcastAll: (payload: unknown) => void,
): void {
  if (captureRestartTimer) {
    clearTimeout(captureRestartTimer);
    captureRestartTimer = null;
  }

  if (playerCount < CAPTURE_MIN_PLAYERS) {
    captureState = createInitialCapture();
    broadcastAll({ type: 'capture_update', capture: captureState });
    return;
  }

  if (captureState.phase === 'active') return;

  resetCaptureZones();
  broadcastAll({
    type: 'chat',
    id: 'system',
    name: 'Sistema',
    text: '📡 Captura de sinal iniciada! Domine Relay Alpha e Relay Beta por 3 minutos.',
    ts: Date.now(),
    scope: 'system',
  });
  broadcastAll({ type: 'capture_update', capture: captureState });
}

export function scheduleCaptureRestart(
  getPlayerCount: () => number,
  broadcastAll: (payload: unknown) => void,
): void {
  if (captureRestartTimer) clearTimeout(captureRestartTimer);
  captureRestartTimer = setTimeout(() => {
    captureRestartTimer = null;
    startCaptureIfReady(getPlayerCount(), broadcastAll);
  }, CAPTURE_RESTART_MS);
}

export function tickCapture(
  players: Map<string, CapturePlayer>,
  broadcastAll: (payload: unknown) => void,
): void {
  if (captureState.phase !== 'active') return;

  const now = Date.now();
  if (now >= captureState.endsAt) {
    endCapture();
    const winner = captureState.winner;
    const msg =
      winner === 'draw'
        ? '⚖️ Captura encerrada — empate entre Alpha e Beta!'
        : winner === 'alpha'
          ? '🏆 Equipe Alpha venceu a captura de sinal!'
          : '🏆 Equipe Beta venceu a captura de sinal!';
    broadcastAll({
      type: 'chat',
      id: 'system',
      name: 'Sistema',
      text: msg,
      ts: Date.now(),
      scope: 'system',
    });
    broadcastAll({ type: 'capture_ended', capture: captureState });
    scheduleCaptureRestart(() => players.size, broadcastAll);
    return;
  }

  for (const zone of captureState.zones) {
    let hackersAlpha = 0;
    let hackersBeta = 0;

    for (const p of players.values()) {
      if (!p.alive || p.inRover) continue;
      const dx = p.x - zone.x;
      const dz = p.z - zone.z;
      if (dx * dx + dz * dz > zone.radius * zone.radius) continue;
      if (p.team === 'alpha') hackersAlpha++;
      else hackersBeta++;
    }

    zone.hackersAlpha = hackersAlpha;
    zone.hackersBeta = hackersBeta;

    if (hackersAlpha > 0 && hackersBeta === 0) {
      zone.alphaSec += 1;
      captureState.scores.alpha += 1;
      zone.status = 'alpha';
    } else if (hackersBeta > 0 && hackersAlpha === 0) {
      zone.betaSec += 1;
      captureState.scores.beta += 1;
      zone.status = 'beta';
    } else if (hackersAlpha > 0 && hackersBeta > 0) {
      zone.status = 'contested';
    } else {
      zone.status = 'neutral';
    }
  }

  broadcastAll({ type: 'capture_update', capture: captureState });
}

export function broadcastProximityChat(
  sender: CapturePlayer,
  text: string,
  send: (ws: WebSocket, payload: unknown) => void,
  players: Map<string, CapturePlayer>,
): void {
  const payload = {
    type: 'chat' as const,
    id: sender.id,
    name: sender.name,
    text,
    ts: Date.now(),
    scope: 'proximity' as const,
    x: sender.x,
    z: sender.z,
  };

  const radiusSq = PROXIMITY_CHAT_RADIUS * PROXIMITY_CHAT_RADIUS;
  for (const p of players.values()) {
    if (p.ws.readyState !== p.ws.OPEN) continue;
    const dx = p.x - sender.x;
    const dz = p.z - sender.z;
    if (p.id === sender.id || dx * dx + dz * dz <= radiusSq) {
      send(p.ws, payload);
    }
  }
}

let satelliteTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSatellitePass(broadcastAll: (payload: unknown) => void): void {
  if (satelliteTimer) clearTimeout(satelliteTimer);
  const delay =
    SATELLITE_MIN_INTERVAL_MS +
    Math.random() * (SATELLITE_MAX_INTERVAL_MS - SATELLITE_MIN_INTERVAL_MS);

  satelliteTimer = setTimeout(() => {
    satelliteTimer = null;
    const azimuth = Math.random() * Math.PI * 2;
    broadcastAll({
      type: 'chat',
      id: 'system',
      name: 'Sistema',
      text: '🛰 Passagem de satélite detectada — rastreie o feixe no céu!',
      ts: Date.now(),
      scope: 'system',
    });
    broadcastAll({
      type: 'satellite_pass',
      durationMs: SATELLITE_DURATION_MS,
      azimuth,
    });
    scheduleSatellitePass(broadcastAll);
  }, delay);
}

export function startSatelliteScheduler(broadcastAll: (payload: unknown) => void): void {
  scheduleSatellitePass(broadcastAll);
}
