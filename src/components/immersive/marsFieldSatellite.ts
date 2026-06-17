import * as THREE from 'three';

export class SatellitePassVisual {
  private scene: THREE.Scene;
  private streak: THREE.Mesh | null = null;
  private endsAt = 0;
  private azimuth = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  trigger(durationMs: number, azimuth: number): void {
    this.disposeStreak();
    this.azimuth = azimuth;
    this.endsAt = performance.now() + durationMs;

    const geometry = new THREE.BoxGeometry(0.35, 0.35, 120);
    const material = new THREE.MeshBasicMaterial({
      color: 0xa8f0ff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    this.streak = new THREE.Mesh(geometry, material);
    this.streak.renderOrder = 20;
    this.scene.add(this.streak);
  }

  update(): void {
    if (!this.streak) return;

    const now = performance.now();
    if (now >= this.endsAt) {
      this.disposeStreak();
      return;
    }

    const t = 1 - (this.endsAt - now) / 12000;
    const elevation = 80 + Math.sin(t * Math.PI) * 15;
    const sweep = this.azimuth + t * 1.4 - 0.7;

    this.streak.position.set(
      Math.cos(sweep) * elevation,
      elevation * 0.55 + 40,
      Math.sin(sweep) * elevation,
    );
    this.streak.rotation.y = sweep + Math.PI / 2;
    this.streak.rotation.x = -0.35;

    const mat = this.streak.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.35 + Math.sin(t * Math.PI) * 0.6;
  }

  private disposeStreak(): void {
    if (!this.streak) return;
    this.scene.remove(this.streak);
    this.streak.geometry.dispose();
    (this.streak.material as THREE.Material).dispose();
    this.streak = null;
    this.endsAt = 0;
  }

  dispose(): void {
    this.disposeStreak();
  }
}
