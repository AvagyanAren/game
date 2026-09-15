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

const TOWER_LAYOUT: { x: number; kind: BlockKind; layers: number }[] = [
  { x: -0.35, kind: 'mint', layers: 8 },
  { x: 0.95, kind: 'mint', layers: 6 },
  { x: 2.25, kind: 'coral', layers: 7 },
  { x: 3.55, kind: 'mint', layers: 7 },
];

const PEDESTAL_H = 0.07;
const PLATFORM_TOP_Y = 0;

function createBlockBody(kind: BlockKind, position: CANNON.Vec3, materials: PhysicsMaterials): CANNON.Body {
  const body = new CANNON.Body({
    mass: kind === 'mint' ? 0.62 : 0.72,
    linearDamping: 0.06,
    angularDamping: 0.22,
    allowSleep: true,
    sleepSpeedLimit: 0.35,
    sleepTimeLimit: 0.4,
    material: materials.block,
  });
  body.addShape(new CANNON.Box(BLOCK_HALF.clone()));
  body.position.copy(position);
  return body;
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
