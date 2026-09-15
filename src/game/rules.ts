import * as CANNON from 'cannon-es';
import type { BlockEntity } from '../physics/blocks';

export type GamePhase = 'playing' | 'gameover';

export type RulesState = {
  phase: GamePhase;
  score: number;
  elapsed: number;
  difficultyLevel: number;
};

export function createRulesState(): RulesState {
  return {
    phase: 'playing',
    score: 0,
    elapsed: 0,
    difficultyLevel: 0,
  };
}

export function updateDifficulty(rules: RulesState, delta: number): number {
  if (rules.phase !== 'playing') {
    return 1;
  }
  rules.elapsed += delta;
  const nextLevel = Math.floor(rules.elapsed / 22);
  if (nextLevel > rules.difficultyLevel) {
    rules.difficultyLevel = nextLevel;
  }
  return 1 + rules.difficultyLevel * 0.14;
}

type ContactPayload = {
  bodyA: CANNON.Body;
  bodyB: CANNON.Body;
};

export function handleBlockContact(
  rules: RulesState,
  event: ContactPayload,
  ballBody: CANNON.Body,
  blockByBody: Map<CANNON.Body, BlockEntity>,
  onMintBreak: (block: BlockEntity) => void,
  onCoralHit: () => void,
): void {  if (rules.phase !== 'playing') {
    return;
  }

  const { bodyA, bodyB } = event;
  let blockBody: CANNON.Body | null = null;
  if (bodyA === ballBody) {
    blockBody = bodyB;
  } else if (bodyB === ballBody) {
    blockBody = bodyA;
  } else {
    return;
  }

  const block = blockByBody.get(blockBody);
  if (!block || !block.alive) {
    return;
  }

  const relative = new CANNON.Vec3();
  ballBody.velocity.vsub(block.body.velocity, relative);
  const relSpeed = relative.length();
  if (relSpeed < 1.4) {
    return;
  }
  if (block.kind === 'coral') {
    onCoralHit();
    return;
  }

  onMintBreak(block);
}

export function wakeUpperBlocks(blocks: BlockEntity[], removed: BlockEntity): void {
  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    if (block.towerIndex === removed.towerIndex && block.layer > removed.layer) {
      block.body.wakeUp();
      block.body.applyImpulse(
        new CANNON.Vec3((Math.random() - 0.5) * 0.8, 1.2, (Math.random() - 0.5) * 0.5),
        block.body.position,
      );
    }
  }
}