export { createScorePill, type ScorePill } from './scorePill';
export { createGameOverOverlay, type GameOverOverlay } from './gameOver';
export {
  buildShareText,
  getGameShareUrl,
  loadBestScore,
  saveBestScore,
  shareGameResult,
} from './share';
export { showToast } from './toast';

export function createUiRoot(): HTMLElement {
  const root = document.createElement('div');  root.id = 'ui-root';
  return root;
}