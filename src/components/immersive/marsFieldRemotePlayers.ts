import * as THREE from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { FieldPlayerState } from '@/types/multiplayer';
import { MAX_HP } from '@/constants/fieldCombat';
import {
  animateAvatarWalk,
  animateAvatarWave,
  createMarsExplorerAvatar,
  getWalkBob,
  type MarsExplorerAvatar,
} from './marsFieldAvatar';
import { createHealthBar, createChatBubble, createNameplate, showChatBubble, updateHealthBar } from './marsFieldNameplate';
import { createLaserRifle } from './marsFieldLaser';
import { animateRoverDrive, animateRoverWave, createMarsRover, type MarsRover } from './marsFieldRover';
import { TEAM_COLORS } from '@/constants/fieldCapture';

const ACCENT_PALETTE = [0xf94a1a, 0x3d8bfd, 0x9b59b6, 0x2ecc71, 0xf1c40f, 0xe74c3c, 0x1abc9c];

interface RemoteEntry {
  id: string;
  name: string;
  avatar: MarsExplorerAvatar;
  rover: MarsRover;
  laser: THREE.Group;
  label: ReturnType<typeof createNameplate>;
  chatBubble: ReturnType<typeof createChatBubble>;
  healthBar: ReturnType<typeof createHealthBar>;
  target: FieldPlayerState;
  current: { x: number; z: number; y: number; yaw: number };
  walkPhase: number;
  drivePhase: number;
}

function accentForId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % ACCENT_PALETTE.length;
  return ACCENT_PALETTE[hash] ?? 0xf94a1a;
}

function mountLabel(label: ReturnType<typeof createNameplate>, host: THREE.Group): void {
  if (label.parent) label.parent.remove(label);
  host.add(label);
}

function mountHealthBar(bar: ReturnType<typeof createHealthBar>, host: THREE.Group): void {
  if (bar.parent) bar.parent.remove(bar);
  host.add(bar);
}

function resolveName(state: FieldPlayerState, fallback = ''): string {
  const fromState = state.name?.trim();
  if (fromState) return fromState;
  const fromFallback = fallback.trim();
  if (fromFallback) return fromFallback;
  return 'Explorador';
}

function withCombatDefaults(state: FieldPlayerState, name: string): FieldPlayerState {
  return {
    ...state,
    name,
    team: state.team ?? 'alpha',
    hp: state.hp ?? MAX_HP,
    alive: state.alive ?? true,
    laserEquipped: state.laserEquipped ?? false,
    respawnAt: state.respawnAt ?? 0,
    inRover: state.inRover ?? false,
    roverId: state.roverId ?? null,
  };
}

function accentForTeam(state: FieldPlayerState): number {
  return TEAM_COLORS[state.team] ?? accentForId(state.id);
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
    for (const p of players) this.upsert(p);
  }

  upsert(state: FieldPlayerState, nameOverride?: string): void {
    let entry = this.remotes.get(state.id);
    const name = resolveName(state, nameOverride ?? entry?.name ?? '');
    const merged = withCombatDefaults(state, name);

    if (!entry) {
      const accent = accentForTeam(merged);
      const avatar = createMarsExplorerAvatar({ accent });
      const rover = createMarsRover({ accent });
      const laser = createLaserRifle();
      laser.visible = false;
      avatar.root.add(laser);

      const label = createNameplate(name, 'remote');
      const chatBubble = createChatBubble();
      const healthBar = createHealthBar();

      entry = {
        id: state.id,
        name,
        avatar,
        rover,
        laser,
        label,
        chatBubble,
        healthBar,
        target: merged,
        current: { x: merged.x, z: merged.z, y: merged.y, yaw: merged.yaw },
        walkPhase: 0,
        drivePhase: 0,
      };
      this.remotes.set(state.id, entry);
      this.scene.add(avatar.root);
      this.scene.add(rover.root);
      rover.root.visible = false;
      mountLabel(label, avatar.root);
      mountHealthBar(healthBar, avatar.root);
      avatar.root.add(chatBubble);
    } else {
      entry.name = name;
      entry.label.element.textContent = name;
    }

    entry.target = withCombatDefaults({ ...entry.target, ...state }, name);
  }

  patchState(id: string, partial: Partial<FieldPlayerState>): void {
    const entry = this.remotes.get(id);
    if (!entry) return;
    entry.target = withCombatDefaults({ ...entry.target, ...partial }, entry.name);
  }

  showChatBubble(id: string, text: string): void {
    const entry = this.remotes.get(id);
    if (!entry) return;
    showChatBubble(entry.chatBubble, text);
  }

  remove(id: string): void {
    const entry = this.remotes.get(id);
    if (!entry) return;
    this.scene.remove(entry.avatar.root);
    this.scene.remove(entry.rover.root);
    entry.avatar.dispose();
    entry.rover.dispose();
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

      const moving = t.moving && t.alive;
      const inRover = t.inRover && t.alive;
      const waving = t.waveUntil > now;

      entry.avatar.root.visible = !inRover;
      entry.rover.root.visible = inRover;
      entry.laser.visible = t.laserEquipped && t.alive && !inRover;

      updateHealthBar(entry.healthBar, t.hp, t.alive);

      if (inRover) {
        if (moving) entry.drivePhase += delta * (t.sprint ? 14 : 9);
        const driveBob = animateRoverDrive(entry.rover, moving, t.sprint, entry.drivePhase);
        if (waving) animateRoverWave(entry.rover);
        entry.rover.root.position.set(entry.current.x, entry.current.y + driveBob, entry.current.z);
        entry.rover.root.rotation.y = entry.current.yaw;
        mountLabel(entry.label, entry.rover.root);
        mountHealthBar(entry.healthBar, entry.rover.root);
      } else {
        if (moving) entry.walkPhase += delta * (t.sprint ? 13 : 9);
        const airborne = entry.current.y > 0.05;
        animateAvatarWalk(entry.avatar, moving, entry.walkPhase, {
          sprint: t.sprint,
          airborne,
        });
        if (waving) animateAvatarWave(entry.avatar, true);
        const bob = airborne ? 0 : getWalkBob(moving, entry.walkPhase, t.sprint);
        entry.avatar.root.position.set(entry.current.x, entry.current.y + bob, entry.current.z);
        entry.avatar.root.rotation.y = entry.current.yaw;
        mountLabel(entry.label, entry.avatar.root);
        mountHealthBar(entry.healthBar, entry.avatar.root);
      }
    }

    this.labelRenderer.render(this.scene, camera);
  }

  dispose(): void {
    for (const id of [...this.remotes.keys()]) this.remove(id);
    this.labelRenderer.domElement.remove();
  }
}
