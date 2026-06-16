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
}

export interface FieldChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
}

export type ServerMessage =
  | { type: 'welcome'; id: string; players: FieldPlayerState[]; online: number }
  | { type: 'player_joined'; player: FieldPlayerState; online: number }
  | { type: 'player_left'; id: string; online: number }
  | { type: 'state'; id: string; x: number; z: number; y: number; yaw: number; sprint: boolean; moving: boolean; waveUntil: number }
  | { type: 'chat'; id: string; name: string; text: string; ts: number }
  | { type: 'online'; count: number }
  | { type: 'error'; message: string };

export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'state'; x: number; z: number; y: number; yaw: number; sprint: boolean; moving: boolean; waveUntil: number }
  | { type: 'chat'; text: string }
  | { type: 'wave' }
  | { type: 'ping' };
