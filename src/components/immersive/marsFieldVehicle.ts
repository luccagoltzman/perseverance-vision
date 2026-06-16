export const PARKED_ROVER = { x: -4, z: 16, yaw: 0.65 };
export const INTERACT_RADIUS = 2.8;

export type VehicleMode = 'foot' | 'rover';

export function horizontalDistance(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

export function exitPositionFromRover(x: number, z: number, yaw: number): { x: number; z: number } {
  return {
    x: x + Math.cos(yaw) * 1.85,
    z: z - Math.sin(yaw) * 1.85,
  };
}
