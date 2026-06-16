import * as THREE from 'three';

export type PlantKind = 'grass' | 'wheat' | 'fern' | 'bush';

export interface PlantInstance {
  x: number;
  z: number;
  rotY: number;
  scale: number;
  phase: number;
  kind: PlantKind;
}

export interface VegetationLayer {
  mesh: THREE.InstancedMesh;
  kind: PlantKind;
}

export interface VegetationSystem {
  layers: VegetationLayer[];
  plants: PlantInstance[];
  dispose: () => void;
}

function getPlantCount(): number {
  if (typeof window === 'undefined') return 4000;
  const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  return isMobile ? 3000 : 7000;
}

function pickKind(): PlantKind {
  const r = Math.random();
  if (r < 0.52) return 'grass';
  if (r < 0.72) return 'wheat';
  if (r < 0.88) return 'fern';
  return 'bush';
}

function createPlants(count: number): PlantInstance[] {
  const spread = 55;
  return Array.from({ length: count }, () => {
    const ring = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(ring) * spread;
    const kind = pickKind();
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius - 18,
      rotY: Math.random() * Math.PI * 2,
      scale:
        kind === 'bush'
          ? 0.55 + Math.random() * 0.7
          : kind === 'wheat'
            ? 0.6 + Math.random() * 0.9
            : 0.4 + Math.random() * 1.05,
      phase: Math.random() * Math.PI * 2,
      kind,
    };
  });
}

function createBladeGeometry(kind: PlantKind): THREE.BufferGeometry {
  switch (kind) {
    case 'wheat': {
      const geo = new THREE.PlaneGeometry(0.1, 1.85, 1, 6);
      geo.translate(0, 0.92, 0);
      return geo;
    }
    case 'fern': {
      const geo = new THREE.PlaneGeometry(0.35, 1.1, 1, 4);
      geo.translate(0, 0.55, 0);
      return geo;
    }
    case 'bush': {
      return new THREE.IcosahedronGeometry(0.38, 0);
    }
    default: {
      const geo = new THREE.PlaneGeometry(0.11, 1.25, 1, 5);
      geo.translate(0, 0.62, 0);
      return geo;
    }
  }
}

function createPlantMaterial(kind: PlantKind): THREE.MeshLambertMaterial {
  switch (kind) {
    case 'wheat':
      return new THREE.MeshLambertMaterial({ color: 0xb8a030, side: THREE.DoubleSide });
    case 'fern':
      return new THREE.MeshLambertMaterial({ color: 0x2d6b32, side: THREE.DoubleSide });
    case 'bush':
      return new THREE.MeshLambertMaterial({ color: 0x3a7a38 });
    default:
      return new THREE.MeshLambertMaterial({ color: 0x4a8f3a, side: THREE.DoubleSide });
  }
}

export function createVegetationSystem(): VegetationSystem {
  const plants = createPlants(getPlantCount());
  const kinds: PlantKind[] = ['grass', 'wheat', 'fern', 'bush'];
  const layers: VegetationLayer[] = [];
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];

  for (const kind of kinds) {
    const subset = plants.filter((p) => p.kind === kind);
    if (subset.length === 0) continue;

    const geo = createBladeGeometry(kind);
    const mat = createPlantMaterial(kind);
    geometries.push(geo);
    materials.push(mat);

    const mesh = new THREE.InstancedMesh(geo, mat, subset.length);
    mesh.castShadow = kind !== 'bush';
    mesh.userData.kind = kind;
    mesh.userData.subset = subset;
    layers.push({ mesh, kind });
  }

  return {
    layers,
    plants,
    dispose: () => {
      materials.forEach((m) => m.dispose());
      geometries.forEach((g) => g.dispose());
    },
  };
}

export function updateVegetation(
  layers: VegetationLayer[],
  dummy: THREE.Object3D,
  time: number,
  windX: number,
  windZ: number,
  bendScale: number,
  windParams: { frequency: number; gustFrequency: number; gustIntensity: number; amplitude: number },
  reducedMotion: boolean,
): void {
  for (const layer of layers) {
    const subset = layer.mesh.userData.subset as PlantInstance[];
    const kind = layer.kind;

    for (let i = 0; i < subset.length; i++) {
      const plant = subset[i];
      const bend = computePlantBend(plant, time, windParams, reducedMotion);
      const kindScale = kind === 'bush' ? 0.35 : kind === 'wheat' ? 1.15 : kind === 'fern' ? 0.85 : 1;
      const bendAmount = bend * bendScale * kindScale;

      dummy.position.set(plant.x, kind === 'bush' ? plant.scale * 0.25 : 0, plant.z);

      if (kind === 'bush') {
        dummy.rotation.set(bendAmount * windZ * 0.3, plant.rotY, -bendAmount * windX * 0.3);
      } else {
        dummy.rotation.set(bendAmount * windZ, plant.rotY, -bendAmount * windX);
      }

      dummy.scale.setScalar(plant.scale);
      dummy.updateMatrix();
      layer.mesh.setMatrixAt(i, dummy.matrix);
    }
    layer.mesh.instanceMatrix.needsUpdate = true;
  }
}

export function computePlantBend(
  plant: PlantInstance,
  time: number,
  p: { frequency: number; gustFrequency: number; gustIntensity: number; amplitude: number },
  reducedMotion: boolean,
): number {
  const gust = Math.sin(time * p.gustFrequency + plant.phase) * p.gustIntensity;
  const sway =
    Math.sin(time * p.frequency + plant.phase) * p.amplitude + gust * p.amplitude * 0.4;
  return reducedMotion ? p.amplitude * 0.35 : sway;
}
