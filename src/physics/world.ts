import * as CANNON from 'cannon-es';

export function createPhysicsWorld(): CANNON.World {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -22, 0),
  });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.allowSleep = false;
  return world;
}
export function createPlatformBody(): CANNON.Body {
  const shape = new CANNON.Box(new CANNON.Vec3(7.5, 0.45, 3.2));
  const body = new CANNON.Body({ mass: 0, material: new CANNON.Material('platform') });
  body.addShape(shape);
  body.position.set(0, -0.45, 0);
  return body;
}