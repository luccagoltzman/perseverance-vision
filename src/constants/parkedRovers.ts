export interface ParkedRoverSpotDef {
  id: string;
  x: number;
  z: number;
  yaw: number;
  label: string;
}

export const PARKED_ROVER_SPOTS: ParkedRoverSpotDef[] = [
  { id: 'alpha', x: -4, z: 16, yaw: 0.65, label: 'Rover Alpha' },
  { id: 'beta', x: 14, z: 5, yaw: -0.85, label: 'Rover Beta' },
  { id: 'gamma', x: -22, z: 0, yaw: 1.35, label: 'Rover Gamma' },
  { id: 'delta', x: 8, z: -18, yaw: -2.1, label: 'Rover Delta' },
];

export const PARKED_ROVER_IDS = new Set(PARKED_ROVER_SPOTS.map((s) => s.id));
