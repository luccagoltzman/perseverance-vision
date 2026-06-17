import * as THREE from 'three';
import type { MarsRover } from './marsFieldRover';
import { createMarsRover } from './marsFieldRover';
import { createRoverHintLabel } from './marsFieldNameplate';
import { PARKED_ROVER_SPOTS } from '@/constants/parkedRovers';

export const INTERACT_RADIUS = 2.8;
export const BOARD_DURATION = 0.85;
export const EXIT_DURATION = 0.65;

export type VehicleMode = 'foot' | 'boarding' | 'rover' | 'exiting';

export interface ParkedRoverSpot {
  id: string;
  x: number;
  z: number;
  yaw: number;
  label: string;
}

export { PARKED_ROVER_SPOTS };

export interface ParkedRoverEntry {
  id: string;
  label: string;
  rover: MarsRover;
  badge: THREE.Object3D;
  interactHint: THREE.Object3D;
}

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

export function seatPositionFromRover(x: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, 0, z);
}

export function createParkedRovers(scene: THREE.Scene, accent = 0xf94a1a): ParkedRoverEntry[] {
  return PARKED_ROVER_SPOTS.map((spot, index) => {
    const roverAccent = index === 0 ? accent : [0x3d8bfd, 0x2ecc71, 0x9b59b6][index - 1] ?? accent;
    const rover = createMarsRover({ accent: roverAccent });
    rover.root.position.set(spot.x, 0, spot.z);
    rover.root.rotation.y = spot.yaw;

    const badge = createRoverHintLabel(spot.label);
    rover.root.add(badge);

    const interactHint = createRoverHintLabel('F — Entrar');
    interactHint.visible = false;
    interactHint.position.set(0, 0.35, 0);
    rover.root.add(interactHint);

    scene.add(rover.root);

    return {
      id: spot.id,
      label: spot.label,
      rover,
      badge,
      interactHint,
    };
  });
}

export function disposeParkedRovers(entries: ParkedRoverEntry[]): void {
  for (const entry of entries) {
    entry.rover.root.removeFromParent();
    entry.rover.dispose();
  }
}

export function findNearestParkedRover(
  entries: ParkedRoverEntry[],
  ax: number,
  az: number,
  occupiedIds: ReadonlySet<string>,
): ParkedRoverEntry | null {
  let nearest: ParkedRoverEntry | null = null;
  let best = INTERACT_RADIUS;

  for (const entry of entries) {
    if (occupiedIds.has(entry.id)) continue;
    const dist = horizontalDistance(ax, az, entry.rover.root.position.x, entry.rover.root.position.z);
    if (dist <= best) {
      best = dist;
      nearest = entry;
    }
  }

  return nearest;
}

export function setParkedRoverTransform(entry: ParkedRoverEntry, x: number, z: number, yaw: number): void {
  entry.rover.root.position.set(x, 0, z);
  entry.rover.root.rotation.y = yaw;
}

export function setParkedRoverVisible(entry: ParkedRoverEntry, visible: boolean): void {
  entry.rover.root.visible = visible;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerpAngle(from: number, to: number, t: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return from + delta * t;
}
