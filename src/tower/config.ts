/** Placeholder numbers — not tuned balance; change here for later tuning. */
export const PLACEHOLDER_BALANCE = {
  tower: {
    maxHp: 100,
    power: 25,
  },
  gun: {
    ringRadius: 52,
    towerRadius: 26,
    fireIntervalSec: 0.45,
  },
  bullet: {
    speed: 480,
    radius: 4,
  },
  shapes: {
    circle: {
      id: 'circle' as const,
      label: 'Круг',
      hp: 50,
      damage: 35,
      speed: 38,
      spawnAngleDeg: -90,
      color: '#ff6b6b',
    },
    square: {
      id: 'square' as const,
      label: 'Квадрат',
      hp: 75,
      damage: 45,
      speed: 32,
      spawnAngleDeg: 30,
      color: '#ffd166',
    },
    triangle: {
      id: 'triangle' as const,
      label: 'Треугольник',
      hp: 100,
      damage: 55,
      speed: 28,
      spawnAngleDeg: 150,
      color: '#06d6a0',
    },
  },
} as const;

export type ShapeKind = keyof typeof PLACEHOLDER_BALANCE.shapes;
