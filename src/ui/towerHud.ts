export type TowerHud = {
  root: HTMLElement;
  setTowerHp: (current: number, max: number) => void;
  setShapeHp: (
    entries: { label: string; hp: number; maxHp: number; color: string }[],
  ) => void;
};

export function createTowerHud(parent: HTMLElement): TowerHud {
  const root = document.createElement('div');
  root.className = 'tower-hud';

  const towerRow = document.createElement('div');
  towerRow.className = 'tower-hud__tower';
  const towerLabel = document.createElement('span');
  towerLabel.className = 'tower-hud__label';
  towerLabel.textContent = 'Башня';
  const towerValue = document.createElement('span');
  towerValue.className = 'tower-hud__value';
  towerValue.textContent = '—';
  towerRow.append(towerLabel, towerValue);

  const shapesList = document.createElement('ul');
  shapesList.className = 'tower-hud__shapes';

  root.append(towerRow, shapesList);
  parent.appendChild(root);

  return {
    root,
    setTowerHp: (current, max) => {
      towerValue.textContent = `${Math.max(0, Math.round(current))} / ${max}`;
    },
    setShapeHp: (entries) => {
      shapesList.replaceChildren();
      for (const entry of entries) {
        const item = document.createElement('li');
        item.className = 'tower-hud__shape';
        const dot = document.createElement('span');
        dot.className = 'tower-hud__dot';
        dot.style.backgroundColor = entry.color;
        const label = document.createElement('span');
        label.textContent = entry.label;
        const value = document.createElement('span');
        value.className = 'tower-hud__value';
        value.textContent = `${Math.max(0, Math.round(entry.hp))} / ${entry.maxHp}`;
        item.append(dot, label, value);
        shapesList.appendChild(item);
      }
    },
  };
}
