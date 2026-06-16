import * as THREE from 'three';

export interface MarsRocksSystem {
  group: THREE.Group;
  dispose: () => void;
}

function createRockMesh(
  size: number,
  color: number,
  roughness: number,
): { mesh: THREE.Mesh; material: THREE.Material } {
  const geo = new THREE.DodecahedronGeometry(size, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 0.82 + Math.random() * 0.35;
    pos.setXYZ(i, x * n, y * n * (0.7 + Math.random() * 0.3), z * n);
  }
  geo.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.05,
    flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return { mesh, material };
}

export function createMarsRocks(): MarsRocksSystem {
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  const palette = [0x7a3828, 0x8f4a32, 0x6b2e22, 0xa05840, 0x5c2818];

  // Rochas espalhadas no campo
  for (let i = 0; i < 55; i++) {
    const size = 0.15 + Math.random() * 0.85;
    const { mesh, material } = createRockMesh(
      size,
      palette[Math.floor(Math.random() * palette.length)],
      0.92,
    );
    materials.push(material);
    geometries.push(mesh.geometry);

    const angle = Math.random() * Math.PI * 2;
    const radius = 8 + Math.random() * 48;
    mesh.position.set(
      Math.cos(angle) * radius,
      size * 0.35,
      Math.sin(angle) * radius - 12,
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    group.add(mesh);
  }

  // Formações no horizonte
  for (let i = 0; i < 22; i++) {
    const size = 1.8 + Math.random() * 4.5;
    const { mesh, material } = createRockMesh(
      size,
      palette[i % palette.length],
      0.98,
    );
    materials.push(material);
    geometries.push(mesh.geometry);

    const t = i / 22;
    const angle = t * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const radius = 42 + Math.random() * 18;
    mesh.position.set(
      Math.cos(angle) * radius,
      size * 0.28,
      Math.sin(angle) * radius - 28,
    );
    mesh.rotation.y = Math.random() * Math.PI * 2;
    mesh.scale.set(1, 0.55 + Math.random() * 0.45, 1);
    group.add(mesh);
  }

  // Afloramentos distantes (silhueta)
  for (let i = 0; i < 8; i++) {
    const size = 5 + Math.random() * 8;
    const geo = new THREE.ConeGeometry(size * 0.55, size, 5);
    geometries.push(geo);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a2018,
      roughness: 1,
      flatShading: true,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(
      (i - 4) * 22 + (Math.random() - 0.5) * 10,
      size * 0.22,
      -58 - Math.random() * 12,
    );
    mesh.rotation.y = Math.random() * Math.PI;
    group.add(mesh);
  }

  return {
    group,
    dispose: () => {
      materials.forEach((m) => m.dispose());
      geometries.forEach((g) => g.dispose());
    },
  };
}
