export interface RoverSpotState {
  id: string;
  x: number;
  z: number;
  yaw: number;
}

const DEFAULT_SPOTS: RoverSpotState[] = [
  { id: 'alpha', x: -4, z: 16, yaw: 0.65 },
  { id: 'beta', x: 14, z: 5, yaw: -0.85 },
  { id: 'gamma', x: -22, z: 0, yaw: 1.35 },
  { id: 'delta', x: 8, z: -18, yaw: -2.1 },
];

const spots = new Map<string, RoverSpotState>(
  DEFAULT_SPOTS.map((s) => [s.id, { ...s }]),
);

export function getRoverSpots(): RoverSpotState[] {
  return [...spots.values()];
}

export function updateRoverSpot(id: string, x: number, z: number, yaw: number): void {
  if (!spots.has(id)) return;
  spots.set(id, { id, x, z, yaw });
}

export function isValidRoverId(id: string | null | undefined): id is string {
  return typeof id === 'string' && spots.has(id);
}

export function isRoverTaken(
  roverId: string,
  players: Iterable<{ id: string; roverId: string | null }>,
  exceptId: string,
): boolean {
  for (const p of players) {
    if (p.id !== exceptId && p.roverId === roverId) return true;
  }
  return false;
}
