import * as CANNON from 'cannon-es';
import type { PhysicsMaterials } from './materials';

export type BlockKind = 'mint' | 'coral';

export type BlockEntity = {
  id: string;
  kind: BlockKind;
  body: CANNON.Body;
  towerIndex: number;
  layer: number;
  alive: boolean;
};

export const BLOCK_HALF = new CANNON.Vec3(0.41, 0.21, 0.41);
export const BLOCK_FULL_Y = BLOCK_HALF.y * 2;

export const COLLISION_GROUP_BALL = 1;
export const COLLISION_GROUP_BLOCK = 2;
export const COLLISION_GROUP_STATIC = 4;

const TOWER_LAYOUT: { x: number; kind: BlockKind; layers: number }[] = [
  { x: -0.35, kind: 'mint', layers: 8 },
  { x: 0.95, kind: 'mint', layers: 6 },
  { x: 2.25, kind: 'coral', layers: 7 },
  { x: 3.55, kind: 'mint', layers: 7 },
];

const PEDESTAL_H = 0.07;
const PLATFORM_TOP_Y = 0;

const BLOCK_MASK_STACKED =
  COLLISION_GROUP_STATIC | COLLISION_GROUP_BLOCK;

function createBlockBody(kind: BlockKind, position: CANNON.Vec3, materials: PhysicsMaterials): CANNON.Body {
  const body = new CANNON.Body({
    mass: kind === 'mint' ? 0.62 : 0.72,
    linearDamping: 0.06,
    angularDamping: 0.22,
    allowSleep: true,
    sleepSpeedLimit: 0.35,
    sleepTimeLimit: 0.4,
    material: materials.block,
    collisionFilterGroup: COLLISION_GROUP_BLOCK,
    collisionFilterMask: BLOCK_MASK_STACKED,
    type: CANNON.Body.STATIC,
  });
  body.addShape(new CANNON.Box(BLOCK_HALF.clone()));
  body.position.copy(position);
  return body;
}

export function resetBlockToTowerPose(block: BlockEntity): void {
  const tower = TOWER_LAYOUT[block.towerIndex];
  const baseY = PLATFORM_TOP_Y + PEDESTAL_H + BLOCK_HALF.y;
  const y = baseY + block.layer * BLOCK_FULL_Y;
  block.body.position.set(tower.x, y, 0);
  block.body.quaternion.set(0, 0, 0, 1);
  block.body.velocity.set(0, 0, 0);
  block.body.angularVelocity.set(0, 0, 0);
}

export function resetAllTowerPoses(blocks: BlockEntity[]): void {
  for (const block of blocks) {
    if (block.alive) {
      resetBlockToTowerPose(block);
    }
  }
}

export function createTowerBlocks(world: CANNON.World, materials: PhysicsMaterials): BlockEntity[] {
  const blocks: BlockEntity[] = [];
  let idCounter = 0;

  TOWER_LAYOUT.forEach((tower, towerIndex) => {
    const baseY = PLATFORM_TOP_Y + PEDESTAL_H + BLOCK_HALF.y;
    for (let layer = 0; layer < tower.layers; layer += 1) {
      const y = baseY + layer * BLOCK_FULL_Y;
      const position = new CANNON.Vec3(tower.x, y, 0);
      const body = createBlockBody(tower.kind, position, materials);
      world.addBody(body);
      blocks.push({
        id: `b-${idCounter++}`,
        kind: tower.kind,
        body,
        towerIndex,
        layer,
        alive: true,
      });
    }
  });

  return blocks;
}

export function createPedestalBodies(world: CANNON.World, materials: PhysicsMaterials): CANNON.Body[] {
  const bodies: CANNON.Body[] = [];
  for (const tower of TOWER_LAYOUT) {
    const body = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
      material: materials.platform,
      collisionFilterGroup: COLLISION_GROUP_STATIC,
      collisionFilterMask: COLLISION_GROUP_BLOCK | COLLISION_GROUP_BALL,
    });
    body.addShape(new CANNON.Box(new CANNON.Vec3(0.52, PEDESTAL_H * 0.5, 0.52)));
    body.position.set(tower.x, PLATFORM_TOP_Y + PEDESTAL_H * 0.5, 0);
    world.addBody(body);
    bodies.push(body);
  }
  return bodies;
}

export function getTowerLayout(): typeof TOWER_LAYOUT {
  return TOWER_LAYOUT;
}

/** Calm start: static upright stacks, block↔block + static; ball off. Play: dynamic + ball. */
export function setBlocksCollideWithBall(blocks: BlockEntity[], enabled: boolean): void {
  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    if (enabled) {
      block.body.type = CANNON.Body.DYNAMIC;
      block.body.collisionFilterMask = BLOCK_MASK_STACKED | COLLISION_GROUP_BALL;
      block.body.wakeUp();
    } else {
      resetBlockToTowerPose(block);
      block.body.type = CANNON.Body.STATIC;
      block.body.collisionFilterMask = BLOCK_MASK_STACKED;
    }
  }
}
