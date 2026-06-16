import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createNameplate(name: string, variant: 'local' | 'remote' = 'remote'): CSS2DObject {
  const el = document.createElement('div');
  el.className =
    variant === 'local' ? 'mars-field-nameplate mars-field-nameplate--local' : 'mars-field-nameplate';
  el.textContent = name;
  const label = new CSS2DObject(el);
  label.position.set(0, 2.35, 0);
  return label;
}
