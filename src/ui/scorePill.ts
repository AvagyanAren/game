export type ScorePill = {
  root: HTMLElement;
  setScore: (score: number) => void;
};

export function createScorePill(parent: HTMLElement): ScorePill {
  const root = document.createElement('div');
  root.className = 'score-pill';
  root.setAttribute('aria-live', 'polite');

  const label = document.createElement('span');
  label.className = 'score-pill__label';
  label.textContent = 'SCORE';

  const value = document.createElement('span');
  value.className = 'score-pill__value';
  value.textContent = '0';

  root.append(label, value);
  parent.appendChild(root);

  return {
    root,
    setScore: (score: number) => {
      value.textContent = String(score);
    },
  };
}