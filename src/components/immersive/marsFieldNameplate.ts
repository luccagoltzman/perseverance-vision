import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createNameplate(name: string, variant: 'local' | 'remote' = 'remote'): CSS2DObject {
  const el = document.createElement('div');
  el.className =
    variant === 'local' ? 'mars-field-nameplate mars-field-nameplate--local' : 'mars-field-nameplate';
  el.textContent = name;
  const label = new CSS2DObject(el);
  label.position.set(0, 2.05, 0);
  return label;
}

export function createRoverHintLabel(text: string): CSS2DObject {
  const el = document.createElement('div');
  el.className = 'mars-field-rover-hint';
  el.textContent = text;
  const label = new CSS2DObject(el);
  label.position.set(0, 2.6, 0);
  return label;
}

export function createHealthBar(): CSS2DObject {
  const el = document.createElement('div');
  el.className = 'mars-field-healthbar';
  el.innerHTML =
    '<div class="mars-field-healthbar__track"><div class="mars-field-healthbar__fill"></div></div>';
  const label = new CSS2DObject(el);
  label.position.set(0, 1.75, 0);
  return label;
}

export function updateHealthBar(label: CSS2DObject, hp: number, alive: boolean): void {
  const fill = label.element.querySelector('.mars-field-healthbar__fill') as HTMLElement | null;
  if (!fill) return;
  const pct = Math.max(0, Math.min(100, hp));
  fill.style.width = `${pct}%`;
  fill.classList.toggle('mars-field-healthbar__fill--low', pct <= 25);
  fill.classList.toggle('mars-field-healthbar__fill--mid', pct > 25 && pct <= 50);
  label.element.style.opacity = alive ? '1' : '0.35';
}

export function mountNameplate(label: CSS2DObject, host: THREE.Object3D): void {
  if (label.parent) label.parent.remove(label);
  host.add(label);
}
