export type TowerGameOverOverlay = {
  root: HTMLElement;
  show: (towerHp: number, killerShapeLabel: string) => void;
  hide: () => void;
  onRestart: (handler: () => void) => void;
  onShare: (handler: () => void) => void;
};

export function createTowerGameOverOverlay(parent: HTMLElement): TowerGameOverOverlay {
  const root = document.createElement('div');
  root.className = 'tower-game-over';
  root.hidden = true;

  const header = document.createElement('div');
  header.className = 'tower-game-over__header';

  const hpLine = document.createElement('p');
  hpLine.className = 'tower-game-over__hp';
  hpLine.textContent = 'HP: 0';

  const killerLine = document.createElement('p');
  killerLine.className = 'tower-game-over__killer';

  header.append(hpLine, killerLine);

  const actions = document.createElement('div');
  actions.className = 'tower-game-over__actions';

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'tower-game-over__btn tower-game-over__btn--again';
  restart.textContent = 'Ещё раз';

  const share = document.createElement('button');
  share.type = 'button';
  share.className = 'tower-game-over__btn tower-game-over__btn--share';
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

  return {
    root,
    show: (towerHp, killerShapeLabel) => {
      hpLine.textContent = `HP: ${Math.max(0, Math.round(towerHp))}`;
      killerLine.textContent = `Победил: ${killerShapeLabel}`;
      root.hidden = false;
    },
    hide: () => {
      root.hidden = true;
    },
    onRestart: (handler) => {
      restartHandler = handler;
    },
    onShare: (handler) => {
      shareHandler = handler;
    },
  };
}
