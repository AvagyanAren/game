import * as CANNON from 'cannon-es';
import type { PhysicsMaterials } from './materials';
import {
  COLLISION_GROUP_BALL,
  COLLISION_GROUP_BLOCK,
  COLLISION_GROUP_STATIC,
} from './blocks';

export type PendulumPhysics = {
  anchorBody: CANNON.Body;
  ballBody: CANNON.Body;
  hinge: CANNON.HingeConstraint;
  ropeLength: number;
  ballRadius: number;
  anchorBaseX: number;
};

const ANCHOR_Y = 9.2;
/** Long enough for the ball arc to intersect tower stacks (was 5.4 — cleared above them). */
const ROPE_LENGTH = 7.45;
const BALL_RADIUS = 0.72;
const BALL_MASS = 11;
/** Left of all towers at rest — avoids overlapping coral at x≈2.25 when rope is long. */
const REST_START_X = -2.8;

let swingMultiplier = 1;

export function setSwingMultiplier(value: number): void {
  swingMultiplier = value;
}

export function resetPendulumState(
  pendulum: PendulumPhysics,
  world: CANNON.World,
  materials: PhysicsMaterials,
): void {
  world.removeConstraint(pendulum.hinge);
  world.removeBody(pendulum.ballBody);
  world.removeBody(pendulum.anchorBody);
  const fresh = createPendulum(world, materials);
  Object.assign(pendulum, fresh);
}

export function createPendulum(world: CANNON.World, materials: PhysicsMaterials): PendulumPhysics {
  const anchorBody = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC });
  anchorBody.position.set(0, ANCHOR_Y, 0);
  world.addBody(anchorBody);

  const ballBody = new CANNON.Body({
    mass: BALL_MASS,
    linearDamping: 0.012,
    angularDamping: 0.018,
    allowSleep: false,
    material: materials.ball,
    collisionFilterGroup: COLLISION_GROUP_BALL,
    collisionFilterMask: COLLISION_GROUP_STATIC | COLLISION_GROUP_BLOCK,
  });
  ballBody.addShape(new CANNON.Sphere(BALL_RADIUS));
  const startY = ANCHOR_Y - Math.sqrt(ROPE_LENGTH ** 2 - REST_START_X ** 2);
  ballBody.position.set(REST_START_X, startY, 0);
  ballBody.velocity.set(0, 0, 0);
  ballBody.angularVelocity.set(0, 0, 0);
  world.addBody(ballBody);

  const pivotB = new CANNON.Vec3();
  anchorBody.position.vsub(ballBody.position, pivotB);

  const hinge = new CANNON.HingeConstraint(anchorBody, ballBody, {
    pivotA: new CANNON.Vec3(0, 0, 0),
    pivotB,
    axisA: new CANNON.Vec3(0, 0, 1),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 1e7,
  });
  world.addConstraint(hinge);

  return {
    anchorBody,
    ballBody,
    hinge,
    ropeLength: ROPE_LENGTH,
    ballRadius: BALL_RADIUS,
    anchorBaseX: 0,
  };
}

export function nudgeSwing(pendulum: PendulumPhysics, direction: -1 | 1): void {
  const { ballBody, anchorBody } = pendulum;
  const impulse = new CANNON.Vec3(
    direction * 5.5 * swingMultiplier,
    direction * 0.45 * swingMultiplier,
    0,
  );
  ballBody.applyImpulse(impulse, ballBody.position);

  const targetX = pendulum.anchorBaseX + direction * 0.55;
  pendulum.anchorBaseX = Math.max(-1.8, Math.min(1.8, targetX));
  anchorBody.position.x += (pendulum.anchorBaseX - anchorBody.position.x) * 0.35;

  const spinBoost = direction * 0.85 * swingMultiplier;
  ballBody.angularVelocity.z += spinBoost;
}

export function dampPendulum(pendulum: PendulumPhysics): void {
  pendulum.ballBody.velocity.set(0, 0, 0);
  pendulum.ballBody.angularVelocity.set(0, 0, 0);
}

/** Gameplay scoring is gated separately; ball always collides with tower blocks. */
export function setBallCollidesWithBlocks(_pendulum: PendulumPhysics, _enabled: boolean): void {
  /* no-op — keep filter mask including COLLISION_GROUP_BLOCK at all times */
}

export function getAnchorWorldPosition(pendulum: PendulumPhysics, target: CANNON.Vec3): CANNON.Vec3 {
  return target.copy(pendulum.anchorBody.position);
}
