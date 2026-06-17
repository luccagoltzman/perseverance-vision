import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { CaptureMatchState, FieldTeam } from '@/types/multiplayer';
import { TEAM_COLORS } from '@/constants/fieldCapture';

const STATUS_COLORS: Record<string, number> = {
  neutral: 0x888888,
  alpha: TEAM_COLORS.alpha,
  beta: TEAM_COLORS.beta,
  contested: 0xf1c40f,
};

interface ZoneVisual {
  root: THREE.Group;
  ring: THREE.Mesh;
  beacon: THREE.Mesh;
  label: CSS2DObject;
}

export class CaptureZoneVisuals {
  private scene: THREE.Scene;
  private zones = new Map<string, ZoneVisual>();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  sync(state: CaptureMatchState | null): void {
    if (!state) return;

    for (const zone of state.zones) {
      let visual = this.zones.get(zone.id);
      if (!visual) {
        visual = this.createZone(zone.label);
        visual.root.position.set(zone.x, 0, zone.z);
        this.zones.set(zone.id, visual);
        this.scene.add(visual.root);
      }

      const color = STATUS_COLORS[zone.status] ?? STATUS_COLORS.neutral;
      const mat = visual.ring.material as THREE.MeshBasicMaterial;
      mat.color.setHex(color);
      mat.opacity = zone.status === 'contested' ? 0.55 : 0.75;

      const beaconMat = visual.beacon.material as THREE.MeshBasicMaterial;
      beaconMat.color.setHex(color);
      beaconMat.opacity = zone.status === 'neutral' ? 0.25 : 0.85;

      const leader =
        zone.alphaSec === zone.betaSec
          ? '—'
          : zone.alphaSec > zone.betaSec
            ? `α ${zone.alphaSec}s`
            : `β ${zone.betaSec}s`;
      visual.label.element.textContent = `${zone.label} · ${leader}`;
    }
  }

  private createZone(label: string): ZoneVisual {
    const root = new THREE.Group();

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.2, 5.5, 48),
      new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.08;
    root.add(ring);

    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.2, 3.2, 8),
      new THREE.MeshBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.4,
      }),
    );
    beacon.position.y = 1.6;
    root.add(beacon);

    const el = document.createElement('div');
    el.className = 'mars-field-capture-label';
    el.textContent = label;
    const labelObj = new CSS2DObject(el);
    labelObj.position.set(0, 3.8, 0);
    root.add(labelObj);

    return { root, ring, beacon, label: labelObj };
  }

  dispose(): void {
    for (const visual of this.zones.values()) {
      this.scene.remove(visual.root);
      visual.ring.geometry.dispose();
      (visual.ring.material as THREE.Material).dispose();
      visual.beacon.geometry.dispose();
      (visual.beacon.material as THREE.Material).dispose();
    }
    this.zones.clear();
  }
}

export function teamAccent(team: FieldTeam): number {
  return TEAM_COLORS[team];
}
