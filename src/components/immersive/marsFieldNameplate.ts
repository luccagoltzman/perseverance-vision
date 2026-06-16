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

export function mountNameplate(label: CSS2DObject, host: THREE.Object3D): void {
  if (label.parent) label.parent.remove(label);
  host.add(label);
}
