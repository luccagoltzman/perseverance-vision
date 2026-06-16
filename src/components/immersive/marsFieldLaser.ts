import * as THREE from 'three';
import { LASER_RANGE } from '@/constants/fieldCombat';

const BEAM_DURATION_MS = 280;

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

interface LaserBeam {
  mesh: THREE.Mesh;
  expiresAt: number;
}

export class LaserBeamManager {
  private scene: THREE.Scene;
  private beams: LaserBeam[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawn(x: number, y: number, z: number, yaw: number, height = 1.15): void {
    const length = LASER_RANGE;
    const centerY = y + height;
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.14, length),
      new THREE.MeshBasicMaterial({
        color: 0x40f0ff,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      }),
    );
    mesh.position.set(
      x + Math.sin(yaw) * (length * 0.5),
      centerY,
      z + Math.cos(yaw) * (length * 0.5),
    );
    mesh.rotation.y = yaw;
    mesh.renderOrder = 10;
    this.scene.add(mesh);
    this.beams.push({ mesh, expiresAt: performance.now() + BEAM_DURATION_MS });
  }

  update(): void {
    const now = performance.now();
    this.beams = this.beams.filter((beam) => {
      if (now >= beam.expiresAt) {
        this.scene.remove(beam.mesh);
        beam.mesh.geometry.dispose();
        (beam.mesh.material as THREE.Material).dispose();
        return false;
      }
      const mat = beam.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0.15, ((beam.expiresAt - now) / BEAM_DURATION_MS) * 0.92);
      return true;
    });
  }

  dispose(): void {
    for (const beam of this.beams) {
      this.scene.remove(beam.mesh);
      beam.mesh.geometry.dispose();
      (beam.mesh.material as THREE.Material).dispose();
    }
    this.beams = [];
  }
}
