import * as THREE from 'three';

export interface MarsRover {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  mast: THREE.Group;
  dispose: () => void;
}

export function createMarsRover(options?: { accent?: number }): MarsRover {
  const root = new THREE.Group();
  const materials: THREE.Material[] = [];
  const accentColor = options?.accent ?? 0xf94a1a;

  const mat = (color: number, opts?: Partial<THREE.MeshStandardMaterialParameters>) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.08, ...opts });
    materials.push(m);
    return m;
  };

  const body = mat(0xe8e4dc);
  const chassis = mat(0xc8c4bc);
  const dark = mat(0x2a2a2a);
  const accent = mat(accentColor);
  const gold = mat(0xc9a227, { metalness: 0.35, roughness: 0.45 });
  const lens = mat(0x1a3a4a, { metalness: 0.6, roughness: 0.2 });

  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.38, 1.85), body);
  deck.position.y = 0.52;
  deck.castShadow = true;
  root.add(deck);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 1.6), chassis);
  belly.position.y = 0.28;
  belly.castShadow = true;
  root.add(belly);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 0.5), accent);
  stripe.position.set(0, 0.62, 0.35);
  root.add(stripe);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.55), gold);
  panel.position.set(0, 0.74, -0.15);
  panel.rotation.x = -0.12;
  root.add(panel);

  const mast = new THREE.Group();
  mast.position.set(0.15, 0.72, 0.55);
  const mastPole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.55, 8), dark);
  mastPole.position.y = 0.28;
  mastPole.castShadow = true;
  mast.add(mastPole);

  const mastHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.18), dark);
  mastHead.position.y = 0.58;
  mastHead.castShadow = true;
  mast.add(mastHead);

  const cam = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.12, 12), lens);
  cam.rotation.x = Math.PI / 2;
  cam.position.set(0, 0.58, 0.14);
  mast.add(cam);
  root.add(mast);

  const wheels: THREE.Mesh[] = [];
  const wheelOffsets: [number, number][] = [
    [-0.62, 0.62],
    [-0.62, 0],
    [-0.62, -0.62],
    [0.62, 0.62],
    [0.62, 0],
    [0.62, -0.62],
  ];

  for (const [x, z] of wheelOffsets) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 14), dark);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.22, z);
    wheel.castShadow = true;
    root.add(wheel);
    wheels.push(wheel);
  }

  return {
    root,
    wheels,
    mast,
    dispose: () => materials.forEach((m) => m.dispose()),
  };
}

export function animateRoverDrive(
  rover: MarsRover,
  moving: boolean,
  sprint: boolean,
  phase: number,
): number {
  const spin = moving ? phase * (sprint ? 1.8 : 1.1) : 0;
  for (const wheel of rover.wheels) {
    wheel.rotation.x = spin;
  }
  return moving ? Math.sin(phase * (sprint ? 2.4 : 1.8)) * (sprint ? 0.025 : 0.015) : 0;
}

export function animateRoverWave(rover: MarsRover): void {
  rover.mast.rotation.z = -0.45;
  rover.mast.rotation.x = 0.15;
}
