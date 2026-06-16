import * as THREE from 'three';

export interface MarsExplorerAvatar {
  root: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  dispose: () => void;
}

export function createMarsExplorerAvatar(options?: { accent?: number }): MarsExplorerAvatar {
  const root = new THREE.Group();
  const materials: THREE.Material[] = [];

  const mat = (color: number, opts?: Partial<THREE.MeshLambertMaterialParameters>) => {
    const m = new THREE.MeshLambertMaterial({ color, ...opts });
    materials.push(m);
    return m;
  };

  const suit = mat(0xddd8d0);
  const accent = mat(options?.accent ?? 0xf94a1a);
  const dark = mat(0x3a3a3a);
  const visor = mat(0x5a9ec4, { transparent: true, opacity: 0.82 });
  const pack = mat(0xb8b0a8);

  // Mochila
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.18), pack);
  backpack.position.set(0, 1.08, 0.2);
  backpack.castShadow = true;
  root.add(backpack);

  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.68, 0.34), suit);
  torso.position.y = 1.06;
  torso.castShadow = true;
  root.add(torso);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.1, 0.36), accent);
  stripe.position.set(0, 1.18, 0);
  root.add(stripe);

  // Cabeça + capacete
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), suit);
  helmet.position.y = 1.58;
  helmet.castShadow = true;
  root.add(helmet);

  const visorMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    visor,
  );
  visorMesh.position.set(0, 1.6, -0.06);
  visorMesh.rotation.x = -0.35;
  root.add(visorMesh);

  // Braços
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.14), suit);
  leftArm.geometry.translate(0, -0.26, 0);
  leftArm.position.set(-0.36, 1.28, 0);
  leftArm.castShadow = true;
  root.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.52, 0.14), suit);
  rightArm.geometry.translate(0, -0.26, 0);
  rightArm.position.set(0.36, 1.28, 0);
  rightArm.castShadow = true;
  root.add(rightArm);

  // Pernas
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.58, 0.17), suit);
  leftLeg.geometry.translate(0, -0.29, 0);
  leftLeg.position.set(-0.14, 0.72, 0);
  leftLeg.castShadow = true;
  root.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.58, 0.17), suit);
  rightLeg.geometry.translate(0, -0.29, 0);
  rightLeg.position.set(0.14, 0.72, 0);
  rightLeg.castShadow = true;
  root.add(rightLeg);

  // Botas
  for (const x of [-0.14, 0.14]) {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.28), dark);
    boot.position.set(x, 0.05, 0.03);
    boot.castShadow = true;
    root.add(boot);
  }

  // Antena
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 6), accent);
  antenna.position.set(0.1, 1.82, 0.08);
  root.add(antenna);

  return {
    root,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    dispose: () => materials.forEach((m) => m.dispose()),
  };
}

export function animateAvatarWalk(
  avatar: MarsExplorerAvatar,
  moving: boolean,
  phase: number,
  options?: { sprint?: boolean; airborne?: boolean },
): void {
  const sprint = options?.sprint ?? false;
  const airborne = options?.airborne ?? false;

  if (airborne) {
    avatar.leftLeg.rotation.x = -0.55;
    avatar.rightLeg.rotation.x = -0.35;
    avatar.leftArm.rotation.x = -0.8;
    avatar.rightArm.rotation.x = -0.8;
    return;
  }

  const swing = moving ? Math.sin(phase) * (sprint ? 0.58 : 0.42) : 0;
  avatar.leftLeg.rotation.x = swing;
  avatar.rightLeg.rotation.x = -swing;
  avatar.leftArm.rotation.x = -swing * (sprint ? 0.75 : 0.55);
  avatar.rightArm.rotation.x = swing * (sprint ? 0.75 : 0.55);
}

/** Oscilação vertical ao caminhar — aplicar somada à altura do salto. */
export function getWalkBob(moving: boolean, phase: number, sprint: boolean): number {
  if (!moving) return 0;
  return Math.abs(Math.sin(phase * (sprint ? 2.6 : 2))) * (sprint ? 0.06 : 0.04);
}

export function animateAvatarWave(avatar: MarsExplorerAvatar, waving: boolean): void {
  if (!waving) return;
  avatar.rightArm.rotation.x = -2.35;
  avatar.rightArm.rotation.z = -0.25;
  avatar.leftArm.rotation.x = -0.25;
}
