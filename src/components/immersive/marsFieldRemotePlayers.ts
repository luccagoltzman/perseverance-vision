import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { FieldPlayerState } from '@/types/multiplayer';
import {
  animateAvatarWalk,
  animateAvatarWave,
  createMarsExplorerAvatar,
  getWalkBob,
  type MarsExplorerAvatar,
} from './marsFieldAvatar';

const ACCENT_PALETTE = [0xf94a1a, 0x3d8bfd, 0x9b59b6, 0x2ecc71, 0xf1c40f, 0xe74c3c, 0x1abc9c];

interface RemoteEntry {
  id: string;
  name: string;
  avatar: MarsExplorerAvatar;
  label: CSS2DObject;
  target: FieldPlayerState;
  current: { x: number; z: number; y: number; yaw: number };
  walkPhase: number;
}

function accentForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[hash] ?? 0xf94a1a;
}

function createNameLabel(name: string): CSS2DObject {
  const el = document.createElement('div');
  el.className = 'mars-field-nameplate';
  el.textContent = name;
  return new CSS2DObject(el);
}

export class RemotePlayersManager {
  private scene: THREE.Scene;
  private container: HTMLElement;
  private labelRenderer: CSS2DRenderer;
  private remotes = new Map<string, RemoteEntry>();

  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.container = container;

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);
    this.resize();
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.labelRenderer.setSize(w, h);
  }

  syncFromWelcome(players: FieldPlayerState[]): void {
    for (const p of players) this.upsert(p, p.name);
  }

  upsert(state: FieldPlayerState, name: string): void {
    let entry = this.remotes.get(state.id);
    if (!entry) {
      const avatar = createMarsExplorerAvatar({ accent: accentForId(state.id) });
      const label = createNameLabel(name);
      label.position.set(0, 2.05, 0);
      avatar.root.add(label);

      entry = {
        id: state.id,
        name,
        avatar,
        label,
        target: { ...state, name },
        current: { x: state.x, z: state.z, y: state.y, yaw: state.yaw },
        walkPhase: 0,
      };
      this.remotes.set(state.id, entry);
      this.scene.add(avatar.root);
    } else {
      entry.name = name;
      entry.label.element.textContent = name;
    }

    entry.target = { ...entry.target, ...state, name };
  }

  remove(id: string): void {
    const entry = this.remotes.get(id);
    if (!entry) return;
    this.scene.remove(entry.avatar.root);
    entry.avatar.dispose();
    this.remotes.delete(id);
  }

  update(delta: number, camera: THREE.Camera): void {
    const now = Date.now();
    const lerpFactor = 1 - Math.pow(0.0008, delta);

    for (const entry of this.remotes.values()) {
      const t = entry.target;
      entry.current.x += (t.x - entry.current.x) * lerpFactor;
      entry.current.z += (t.z - entry.current.z) * lerpFactor;
      entry.current.y += (t.y - entry.current.y) * lerpFactor;
      entry.current.yaw += (t.yaw - entry.current.yaw) * lerpFactor;

      const moving = t.moving;
      if (moving) entry.walkPhase += delta * (t.sprint ? 13 : 9);

      const airborne = entry.current.y > 0.05;
      const waving = t.waveUntil > now;

      animateAvatarWalk(entry.avatar, moving, entry.walkPhase, {
        sprint: t.sprint,
        airborne,
      });
      if (waving) animateAvatarWave(entry.avatar, true);

      const bob = airborne ? 0 : getWalkBob(moving, entry.walkPhase, t.sprint);
      entry.avatar.root.position.set(entry.current.x, entry.current.y + bob, entry.current.z);
      entry.avatar.root.rotation.y = entry.current.yaw;
    }

    this.labelRenderer.render(this.scene, camera);
  }

  dispose(): void {
    for (const id of [...this.remotes.keys()]) this.remove(id);
    this.labelRenderer.domElement.remove();
  }
}
