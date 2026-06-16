export interface FieldPlayerState {
  id: string;
  name: string;
  x: number;
  z: number;
  y: number;
  yaw: number;
  sprint: boolean;
  moving: boolean;
  waveUntil: number;
  inRover: boolean;
  hp: number;
  alive: boolean;
  laserEquipped: boolean;
  respawnAt: number;
}

export interface LocalCombatState {
  hp: number;
  alive: boolean;
  laserEquipped: boolean;
  respawnAt: number;
}

export interface FieldChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
}

export type ServerMessage =
  | { type: 'welcome'; id: string; players: FieldPlayerState[]; online: number; self: LocalCombatState }
  | { type: 'player_joined'; player: FieldPlayerState; online: number }
  | { type: 'player_left'; id: string; online: number }
  | {
      type: 'state';
      id: string;
      x: number;
      z: number;
      y: number;
      yaw: number;
      sprint: boolean;
      moving: boolean;
      waveUntil: number;
      inRover: boolean;
      hp: number;
      alive: boolean;
      laserEquipped: boolean;
      respawnAt: number;
    }
  | { type: 'laser_shot'; id: string; x: number; z: number; y: number; yaw: number }
  | { type: 'player_hit'; victimId: string; attackerId: string; hp: number; damage: number }
  | { type: 'player_died'; id: string; respawnAt: number; killerId: string | null }
  | { type: 'player_respawned'; player: FieldPlayerState }
  | { type: 'chat'; id: string; name: string; text: string; ts: number }
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
    }
  | { type: 'chat'; text: string }
  | { type: 'wave' }
  | { type: 'shoot' }
  | { type: 'equip_laser' }
  | { type: 'stow_laser' }
  | { type: 'ping' };
