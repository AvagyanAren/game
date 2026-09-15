import * as THREE from 'three';
import type { BlockEntity } from '../physics/blocks';
import { BLOCK_HALF, getTowerLayout } from '../physics/blocks';
import { COLORS, matteMaterial } from './materials';
const BLOCK_W = BLOCK_HALF.x * 2;
const BLOCK_H = BLOCK_HALF.y * 2;
const BLOCK_D = BLOCK_HALF.z * 2;

function blockColor(kind: BlockEntity['kind']): number {
  return kind === 'mint' ? COLORS.mint : COLORS.coral;
}

function createCrenelTop(kind: BlockEntity['kind']): THREE.Group {
  const group = new THREE.Group();
  const mat = matteMaterial(blockColor(kind), 0.84);
  const base = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D), mat);
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const toothGeo = new THREE.BoxGeometry(BLOCK_W * 0.18, BLOCK_H * 0.55, BLOCK_D * 0.18);
  const offsets: [number, number][] = [
    [-BLOCK_W * 0.32, -BLOCK_D * 0.32],
    [BLOCK_W * 0.32, -BLOCK_D * 0.32],
    [-BLOCK_W * 0.32, BLOCK_D * 0.32],
    [BLOCK_W * 0.32, BLOCK_D * 0.32],
  ];
  for (const [tx, tz] of offsets) {
    const tooth = new THREE.Mesh(toothGeo, mat);
    tooth.position.set(tx, BLOCK_H * 0.72, tz);
    tooth.castShadow = true;
    group.add(tooth);
  }
  return group;
}

function createBlockMesh(block: BlockEntity, isTop: boolean): THREE.Object3D {
  if (isTop) {
    return createCrenelTop(block.kind);
  }
  const mat = matteMaterial(blockColor(block.kind), 0.84);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(BLOCK_W, BLOCK_H, BLOCK_D), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export type CityView = {
  root: THREE.Group;
  meshById: Map<string, THREE.Object3D>;
};

export function createCityView(blocks: BlockEntity[]): CityView {
  const root = new THREE.Group();
  const meshById = new Map<string, THREE.Object3D>();
  const layout = getTowerLayout();

  const pedestalMat = matteMaterial(COLORS.pedestal, 0.88);
  layout.forEach((tower) => {
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.07, 1.05), pedestalMat);
    pedestal.position.set(tower.x, 0.035, 0);
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    root.add(pedestal);
  });

  const topLayerByTower = new Map<number, number>();
  blocks.forEach((block) => {
    const current = topLayerByTower.get(block.towerIndex) ?? -1;
    topLayerByTower.set(block.towerIndex, Math.max(current, block.layer));
  });

  blocks.forEach((block) => {
    const isTop = block.layer === topLayerByTower.get(block.towerIndex);
    const mesh = createBlockMesh(block, isTop);
    root.add(mesh);
    meshById.set(block.id, mesh);
  });

  return { root, meshById };
}

export function syncCityView(city: CityView, blocks: BlockEntity[]): void {
  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    const mesh = city.meshById.get(block.id);
    if (!mesh) {
      continue;
    }
    const { body } = block;
    mesh.position.set(body.position.x, body.position.y, body.position.z);
    mesh.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
  }
}

export function removeBlockMesh(city: CityView, block: BlockEntity): void {
  const mesh = city.meshById.get(block.id);
  if (!mesh) {
    return;
  }
  city.root.remove(mesh);
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
    }
  });
  city.meshById.delete(block.id);
}