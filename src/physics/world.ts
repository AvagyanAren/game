import * as CANNON from 'cannon-es';
import {
  COLLISION_GROUP_BALL,
  COLLISION_GROUP_BLOCK,
  COLLISION_GROUP_STATIC,
} from './blocks';
import {
  createPhysicsMaterials,
  registerContactMaterials,
  type PhysicsMaterials,
} from './materials';

export type PhysicsWorldBundle = {
  world: CANNON.World;
  materials: PhysicsMaterials;
};

export function createPhysicsWorld(): PhysicsWorldBundle {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -22, 0),
  });

  const solver = new CANNON.GSSolver();
  solver.iterations = 25;
  solver.tolerance = 0.001;
  world.solver = solver;

  const broadphase = new CANNON.SAPBroadphase(world);
  broadphase.useBoundingBoxes = true;
  world.broadphase = broadphase;

  world.allowSleep = true;

  const materials = createPhysicsMaterials();
  registerContactMaterials(world, materials);

  return { world, materials };
}

export function createPlatformBody(materials: PhysicsMaterials): CANNON.Body {
  const shape = new CANNON.Box(new CANNON.Vec3(7.5, 0.45, 3.2));
  const body = new CANNON.Body({
    mass: 0,
    type: CANNON.Body.STATIC,
    material: materials.platform,
    collisionFilterGroup: COLLISION_GROUP_STATIC,
    collisionFilterMask: COLLISION_GROUP_BLOCK | COLLISION_GROUP_BALL,
  });
  body.addShape(shape);
  body.position.set(0, -0.45, 0);
  return body;
}
