import * as THREE from 'three';
import { LASER_RANGE } from '@/constants/fieldCombat';

export function createLaserRifle(): THREE.Group {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x3a4450, metalness: 0.5, roughness: 0.35 }),
  );
  body.position.set(0, 0, -0.18);
  root.add(body);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.28, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a8a9a, metalness: 0.65, roughness: 0.25 }),
  );
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.02, -0.42);
  root.add(barrel);

  const emitter = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x00e5ff }),
  );
  emitter.position.set(0, 0.02, -0.58);
  root.add(emitter);

  root.position.set(0.28, 1.05, -0.12);
  root.rotation.set(-0.35, -0.15, 0);
  return root;
}

export interface LaserBeam {
  line: THREE.Line;
  expiresAt: number;
}

export class LaserBeamManager {
  private scene: THREE.Scene;
  private beams: LaserBeam[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(x: number, y: number, z: number, yaw: number, height = 1.2): void {
    const start = new THREE.Vector3(x, y + height, z);
    const end = new THREE.Vector3(
      x + Math.sin(yaw) * LASER_RANGE,
      y + height,
      z + Math.cos(yaw) * LASER_RANGE,
    );

    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: 0x00eaff,
      transparent: true,
      opacity: 0.92,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.beams.push({ line, expiresAt: performance.now() + 120 });
  }

  update(): void {
    const now = performance.now();
    this.beams = this.beams.filter((beam) => {
      if (now >= beam.expiresAt) {
        this.scene.remove(beam.line);
        beam.line.geometry.dispose();
        (beam.line.material as THREE.Material).dispose();
        return false;
      }
      const mat = beam.line.material as THREE.LineBasicMaterial;
      mat.opacity = Math.max(0, (beam.expiresAt - now) / 120);
      return true;
    });
  }

  dispose(): void {
    for (const beam of this.beams) {
      this.scene.remove(beam.line);
      beam.line.geometry.dispose();
      (beam.line.material as THREE.Material).dispose();
    }
    this.beams = [];
  }
}
