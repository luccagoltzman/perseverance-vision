import type { FieldTeam } from '@/types/multiplayer';

export const CAPTURE_ZONE_RADIUS = 5.5;
export const CAPTURE_MATCH_MS = 180_000;
export const CAPTURE_RESTART_MS = 15_000;
export const CAPTURE_TICK_MS = 1000;
export const CAPTURE_MIN_PLAYERS = 2;

export const CAPTURE_ZONES = [
  { id: 'zone-a' as const, label: 'Relay Alpha', x: -32, z: -18 },
  { id: 'zone-b' as const, label: 'Relay Beta', x: 28, z: 22 },
];

export const TEAM_LABELS: Record<FieldTeam, string> = {
  alpha: 'Equipe Alpha',
  beta: 'Equipe Beta',
};

export const TEAM_COLORS: Record<FieldTeam, number> = {
  alpha: 0x3d8bfd,
  beta: 0x2ecc71,
};
