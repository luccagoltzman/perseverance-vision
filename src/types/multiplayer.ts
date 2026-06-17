export type FieldTeam = 'alpha' | 'beta';

export interface FieldPlayerState {
  id: string;
  name: string;
  team: FieldTeam;
  x: number;
  z: number;
  y: number;
  yaw: number;
  sprint: boolean;
  moving: boolean;
  waveUntil: number;
  inRover: boolean;
  roverId: string | null;
  hp: number;
  alive: boolean;
  laserEquipped: boolean;
  respawnAt: number;
}

export interface RoverSpotState {
  id: string;
  x: number;
  z: number;
  yaw: number;
}

export interface LocalCombatState {
  hp: number;
  alive: boolean;
  laserEquipped: boolean;
  respawnAt: number;
}

export type ChatScope = 'proximity' | 'system';

export interface FieldChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
  scope: ChatScope;
  x?: number;
  z?: number;
}

export type CaptureZoneId = 'zone-a' | 'zone-b';

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

export interface ServerFeatures {
  combat: boolean;
  capture: boolean;
  rovers: boolean;
}

export type ServerMessage =
  | {
      type: 'welcome';
      id: string;
      team?: FieldTeam;
      players: FieldPlayerState[];
      online: number;
      self?: LocalCombatState;
      capture?: CaptureMatchState;
      roverSpots?: RoverSpotState[];
      features?: ServerFeatures;
    }
  | { type: 'player_joined'; player: FieldPlayerState; online: number }
  | { type: 'player_left'; id: string; online: number }
  | {
      type: 'state';
      id: string;
      name: string;
      team: FieldTeam;
      x: number;
      z: number;
      y: number;
      yaw: number;
      sprint: boolean;
      moving: boolean;
      waveUntil: number;
      inRover: boolean;
      roverId: string | null;
      hp: number;
      alive: boolean;
      laserEquipped: boolean;
      respawnAt: number;
    }
  | { type: 'laser_shot'; id: string; x: number; z: number; y: number; yaw: number }
  | { type: 'player_hit'; victimId: string; attackerId: string; hp: number; damage: number }
  | { type: 'player_died'; id: string; respawnAt: number; killerId: string | null }
  | { type: 'player_respawned'; player: FieldPlayerState }
  | {
      type: 'chat';
      id: string;
      name: string;
      text: string;
      ts: number;
      scope: ChatScope;
      x?: number;
      z?: number;
    }
  | { type: 'capture_update'; capture: CaptureMatchState }
  | { type: 'capture_ended'; capture: CaptureMatchState }
  | { type: 'rover_spots'; spots: RoverSpotState[] }
  | { type: 'satellite_pass'; durationMs: number; azimuth: number }
  | { type: 'online'; count: number }
  | { type: 'error'; message: string };

export type ClientMessage =
  | { type: 'join'; name: string }
  | {
      type: 'state';
      x: number;
      z: number;
      y: number;
      yaw: number;
      sprint: boolean;
      moving: boolean;
      waveUntil: number;
      inRover: boolean;
      roverId?: string | null;
      laserEquipped?: boolean;
    }
  | { type: 'chat'; text: string }
  | { type: 'wave' }
  | { type: 'shoot'; laserEquipped?: boolean }
  | { type: 'equip_laser' }
  | { type: 'stow_laser' }
  | { type: 'ping' };
