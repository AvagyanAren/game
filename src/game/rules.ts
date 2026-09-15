import * as CANNON from 'cannon-es';
import type { BlockEntity } from '../physics/blocks';

export type GamePhase = 'playing' | 'gameover';

export type RulesState = {
  phase: GamePhase;
  score: number;
  elapsed: number;
  difficultyLevel: number;
  /** Mint/coral rules and strike impulses — only after the first swing tap. */
  hitsEnabled: boolean;
};

export function createRulesState(): RulesState {
  return {
    phase: 'playing',
    score: 0,
    elapsed: 0,
    difficultyLevel: 0,
    hitsEnabled: false,
  };
}

export function updateDifficulty(rules: RulesState, delta: number): number {
  if (rules.phase !== 'playing' || !rules.hitsEnabled) {
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
  blocks: BlockEntity[],
  blockByBody: Map<CANNON.Body, BlockEntity>,
  onMintBreak: (block: BlockEntity) => void,
  onCoralHit: () => void,
): void {
  if (rules.phase !== 'playing') {
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
  resolveBallBlockStrike(
    rules,
    blocks,
    block,
    strikeSpeedForHit(ballBody, relative.length()),
    onMintBreak,
    onCoralHit,
  );
}

export function resolveBallBlockStrike(
  rules: RulesState,
  blocks: BlockEntity[],
  block: BlockEntity,
  relSpeed: number,
  onMintBreak: (block: BlockEntity) => void,
  onCoralHit: () => void,
): void {
  if (rules.phase !== 'playing' || !rules.hitsEnabled || !block.alive) {
    return;
  }

  wakeTowerBlocks(blocks, block);

  if (block.kind === 'coral') {
    onCoralHit();
    return;
  }

  if (relSpeed < 0.35) {
    return;
  }

  onMintBreak(block);
}

export function strikeSpeedForHit(ballBody: CANNON.Body, relSpeed: number): number {
  return Math.max(relSpeed, ballBody.velocity.length());
}

export function wakeTowerBlocks(blocks: BlockEntity[], struck: BlockEntity): void {
  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    if (block.towerIndex !== struck.towerIndex) {
      continue;
    }
    block.body.wakeUp();
    if (block.layer >= struck.layer - 1) {
      block.body.angularVelocity.x += (Math.random() - 0.5) * 0.6;
      block.body.angularVelocity.z += (Math.random() - 0.5) * 0.6;
    }
  }
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