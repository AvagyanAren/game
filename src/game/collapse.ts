import * as CANNON from 'cannon-es';
import type { BlockEntity } from '../physics/blocks';

export function collapseRemainingTowers(
  blocks: BlockEntity[],
  ballBody: CANNON.Body,
): void {
  const ballPos = ballBody.position;
  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    block.body.wakeUp();
    const impulse = new CANNON.Vec3(
      block.body.position.x - ballPos.x + (Math.random() - 0.5) * 0.6,
      1.4 + Math.random() * 0.8,
      (Math.random() - 0.5) * 0.5,
    );
    impulse.scale(1.8, impulse);
    block.body.applyImpulse(impulse, block.body.position);
    block.body.angularVelocity.set(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
    );
  }

  ballBody.applyImpulse(new CANNON.Vec3(0.8, -0.6, 0), ballBody.position);
}