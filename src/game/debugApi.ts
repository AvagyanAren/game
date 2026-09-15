import type { BlockEntity } from '../physics/blocks';
import { BLOCK_FULL_Y } from '../physics/blocks';
import type { RulesState } from './rules';

export type TowerMetrics = {
  towerIndex: number;
  blockCount: number;
  minY: number;
  maxY: number;
  heightSpan: number;
};

export type MayatnikDebugSnapshot = {
  phase: RulesState['phase'];
  score: number;
  hitsEnabled: boolean;
  gameOverVisible: boolean;
  towers: TowerMetrics[];
  minTowerSpan: number;
};

export function buildTowerMetrics(blocks: BlockEntity[]): TowerMetrics[] {
  const byTower = new Map<number, { minY: number; maxY: number; count: number }>();

  for (const block of blocks) {
    if (!block.alive) {
      continue;
    }
    const y = block.body.position.y;
    const entry = byTower.get(block.towerIndex) ?? {
      minY: y,
      maxY: y,
      count: 0,
    };
    entry.minY = Math.min(entry.minY, y);
    entry.maxY = Math.max(entry.maxY, y);
    entry.count += 1;
    byTower.set(block.towerIndex, entry);
  }

  return [...byTower.entries()]
    .sort(([a], [b]) => a - b)
    .map(([towerIndex, { minY, maxY, count }]) => ({
      towerIndex,
      blockCount: count,
      minY,
      maxY,
      heightSpan: maxY - minY,
    }));
}

/** Tall stacks span at least (layers-1) * block height; 6+ layers → ~2.1m+ */
export const MIN_TOWER_SPAN_PLAY = BLOCK_FULL_Y * 4;

export function isDebugHarnessEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return new URLSearchParams(window.location.search).get('debug') === '1';
}
