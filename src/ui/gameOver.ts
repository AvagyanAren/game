export type GameOverOverlay = {
  root: HTMLElement;
  show: (score: number, bestScore: number) => void;
  hide: () => void;
  setRestartEnabled: (enabled: boolean) => void;
  onRestart: (handler: () => void) => void;
  onShare: (handler: () => void) => void;
};

export function createGameOverOverlay(parent: HTMLElement): GameOverOverlay {
  const root = document.createElement('div');
  root.className = 'game-over';
  root.hidden = true;

  const header = document.createElement('div');
  header.className = 'game-over__header';

  const title = document.createElement('p');
  title.className = 'game-over__title';
  title.textContent = 'Конец';

  const score = document.createElement('p');
  score.className = 'game-over__score';
  score.textContent = '0';

  const best = document.createElement('p');
  best.className = 'game-over__best';
  best.hidden = true;

  header.append(title, score, best);

  const actions = document.createElement('div');
  actions.className = 'game-over__actions';

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'game-over__btn game-over__btn--again';
  restart.textContent = 'Ещё раз';

  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'game-over__btn game-over__btn--share';
  share.textContent = 'Поделиться';

  actions.append(restart, share);
  root.append(header, actions);
  parent.appendChild(root);

  let restartHandler: (() => void) | null = null;
  let shareHandler: (() => void) | null = null;

  restart.addEventListener('click', () => {
    restartHandler?.();
  });
  share.addEventListener('click', () => {
    shareHandler?.();
  });

  const setRestartEnabled = (enabled: boolean): void => {
    restart.disabled = !enabled;
    restart.setAttribute('aria-disabled', enabled ? 'false' : 'true');
  };

  return {
    root,
    show: (value: number, bestScore: number) => {
      score.textContent = String(value);
      if (bestScore > 0) {
        best.hidden = false;
        best.textContent = `Рекорд: ${bestScore}`;
      } else {
        best.hidden = true;
      }
      setRestartEnabled(false);
      share.disabled = false;
      root.hidden = false;
    },
    hide: () => {
      root.hidden = true;
    },
    setRestartEnabled,
    onRestart: (handler: () => void) => {
      restartHandler = handler;
    },
    onShare: (handler: () => void) => {
      shareHandler = handler;
    },
  };
}
