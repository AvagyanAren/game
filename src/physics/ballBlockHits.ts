import * as CANNON from 'cannon-es';
import { BLOCK_HALF, type BlockEntity } from './blocks';

const _ballLocal = new CANNON.Vec3();
const _closest = new CANNON.Vec3();
const _invQuat = new CANNON.Quaternion();
const _scratch = new CANNON.Vec3();

/** Sphere vs oriented box (block half extents in local space). */
export function sphereIntersectsBlock(
  ballPosition: CANNON.Vec3,
  ballRadius: number,
  blockBody: CANNON.Body,
  halfExtents: CANNON.Vec3 = BLOCK_HALF,
): boolean {
  _invQuat.copy(blockBody.quaternion);
  _invQuat.conjugate(_invQuat);

  _ballLocal.copy(ballPosition);
  _ballLocal.vsub(blockBody.position, _ballLocal);
  _invQuat.vmult(_ballLocal, _ballLocal);

  _closest.set(
    clamp(_ballLocal.x, -halfExtents.x, halfExtents.x),
    clamp(_ballLocal.y, -halfExtents.y, halfExtents.y),
    clamp(_ballLocal.z, -halfExtents.z, halfExtents.z),
  );

  _scratch.copy(_ballLocal);
  _scratch.vsub(_closest, _scratch);
  return _scratch.lengthSquared() <= ballRadius * ballRadius;
}

/** Eject ball from an overlapping block so Cannon contacts can take over. */
export function separateBallFromBlock(
  ballBody: CANNON.Body,
  ballRadius: number,
  blockBody: CANNON.Body,
  halfExtents: CANNON.Vec3 = BLOCK_HALF,
): void {
  _invQuat.copy(blockBody.quaternion);
  _invQuat.conjugate(_invQuat);

  _ballLocal.copy(ballBody.position);
  _ballLocal.vsub(blockBody.position, _ballLocal);
  _invQuat.vmult(_ballLocal, _ballLocal);

  _closest.set(
    clamp(_ballLocal.x, -halfExtents.x, halfExtents.x),
    clamp(_ballLocal.y, -halfExtents.y, halfExtents.y),
    clamp(_ballLocal.z, -halfExtents.z, halfExtents.z),
  );

  _scratch.copy(_ballLocal);
  _scratch.vsub(_closest, _scratch);
  const distSq = _scratch.lengthSquared();
  const pen = ballRadius - Math.sqrt(distSq);
  if (pen <= 0.001) {
    return;
  }

  if (distSq < 1e-8) {
    _scratch.set(0, 1, 0);
  } else {
    _scratch.normalize();
  }

  blockBody.quaternion.vmult(_scratch, _scratch);

  ballBody.position.x += _scratch.x * (pen + 0.04);
  ballBody.position.y += _scratch.y * (pen + 0.04);
  ballBody.position.z += _scratch.z * (pen + 0.04);
  ballBody.wakeUp();
}

export type BallBlockHit = {
  block: BlockEntity;
  relSpeed: number;
};

export function findBallBlockHits(
  ballBody: CANNON.Body,
  ballRadius: number,
  blocks: BlockEntity[],
  segmentStart: CANNON.Vec3,
  segmentEnd: CANNON.Vec3,
  sweepSteps = 8,
): BallBlockHit[] {
  const hits: BallBlockHit[] = [];
  const rel = new CANNON.Vec3();
  const sample = new CANNON.Vec3();

  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }

    let intersects = sphereIntersectsBlock(segmentEnd, ballRadius, block.body);
    if (!intersects && sweepSteps > 0) {
      for (let step = 0; step <= sweepSteps; step += 1) {
        const t = step / sweepSteps;
        sample.set(
          segmentStart.x + (segmentEnd.x - segmentStart.x) * t,
          segmentStart.y + (segmentEnd.y - segmentStart.y) * t,
          segmentStart.z + (segmentEnd.z - segmentStart.z) * t,
        );
        if (sphereIntersectsBlock(sample, ballRadius, block.body)) {
          intersects = true;
          break;
        }
      }
    }

    if (!intersects) {
      continue;
    }

    ballBody.velocity.vsub(block.body.velocity, rel);
    hits.push({
      block,
      relSpeed: rel.length(),
    });
  }

  return hits;
}

export function applyBallStrikeImpulse(ballBody: CANNON.Body, blockBody: CANNON.Body): void {
  blockBody.wakeUp();

  _scratch.copy(blockBody.position);
  _scratch.vsub(ballBody.position, _scratch);
  if (_scratch.lengthSquared() < 1e-6) {
    _scratch.set(1, 0.2, 0);
  }
  _scratch.normalize();

  const speed = Math.max(ballBody.velocity.length(), 2.5);
  const impulseMag = speed * ballBody.mass * 0.22;
  _scratch.scale(impulseMag, _scratch);
  blockBody.applyImpulse(_scratch, blockBody.position);

  blockBody.angularVelocity.x += (Math.random() - 0.5) * speed * 0.08;
  blockBody.angularVelocity.z += (Math.random() - 0.5) * speed * 0.08;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
