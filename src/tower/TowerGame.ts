import { PLACEHOLDER_BALANCE, type ShapeKind } from './config';
import {
  createTowerGameOverOverlay,
  type TowerGameOverOverlay,
} from '../ui/towerGameOver';
import { createTowerHud, type TowerHud } from '../ui/towerHud';
import { copyPageUrl } from '../ui/shareUrl';

type Phase = 'playing' | 'gameover';

type ShapeState = {
  kind: ShapeKind;
  hp: number;
  x: number;
  y: number;
  alive: boolean;
  reachedTower: boolean;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const SHAPE_KINDS: ShapeKind[] = ['circle', 'square', 'triangle'];

export class TowerGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly mount: HTMLElement;
  private readonly hud: TowerHud;
  private readonly gameOver: TowerGameOverOverlay;
  private rafId = 0;
  private lastTime = 0;
  private fireCooldown = 0;
  private phase: Phase = 'playing';
  private towerHp: number = PLACEHOLDER_BALANCE.tower.maxHp;
  private aimAngle = -Math.PI / 2;
  private pointerTracking = false;
  private shapes: ShapeState[] = [];
  private bullets: Bullet[] = [];
  constructor(mount: HTMLElement, uiRoot: HTMLElement) {
    this.mount = mount;
    this.hud = createTowerHud(uiRoot);
    this.gameOver = createTowerGameOverOverlay(uiRoot);
    this.gameOver.onRestart(() => this.restartRound());
    this.gameOver.onShare(() => {
      void copyPageUrl();
    });

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('aria-label', 'Игровое поле башни');
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D unavailable');
    }
    this.ctx = ctx;
    this.mount.appendChild(this.canvas);

    this.bindInput();
    window.addEventListener('resize', this.onResize);
    this.onResize();
    this.resetRoundState();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private bindInput(): void {
    const updateAimFromClient = (clientX: number, clientY: number): void => {
      const rect = this.canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      this.aimAngle = Math.atan2(clientY - cy, clientX - cx);
    };

    const onPointerDown = (event: PointerEvent): void => {
      if (this.phase !== 'playing') {
        return;
      }
      this.canvas.setPointerCapture(event.pointerId);
      this.pointerTracking = true;
      updateAimFromClient(event.clientX, event.clientY);
    };

    const onPointerMove = (event: PointerEvent): void => {
      if (!this.pointerTracking || this.phase !== 'playing') {
        return;
      }
      updateAimFromClient(event.clientX, event.clientY);
    };

    const endPointer = (event: PointerEvent): void => {
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
      this.pointerTracking = false;
    };

    this.canvas.addEventListener('pointerdown', onPointerDown);
    this.canvas.addEventListener('pointermove', onPointerMove);
    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
  }

  private resetRoundState(): void {
    this.phase = 'playing';
    this.towerHp = PLACEHOLDER_BALANCE.tower.maxHp;
    this.aimAngle = -Math.PI / 2;
    this.pointerTracking = false;
    this.fireCooldown = 0;
    this.bullets = [];
    this.shapes = this.createShapes();
    this.gameOver.hide();
    this.hud.root.hidden = false;
    this.syncHud();
  }

  private restartRound(): void {
    this.resetRoundState();
  }

  private createShapes(): ShapeState[] {
    const { width, height } = this.getPlayfieldSize();
    const cx = width / 2;
    const cy = height / 2;
    const spawnDist = Math.hypot(width, height) * 0.55;

    return SHAPE_KINDS.map((kind) => {
      const def = PLACEHOLDER_BALANCE.shapes[kind];
      const angle = (def.spawnAngleDeg * Math.PI) / 180;
      return {
        kind,
        hp: def.hp,
        x: cx + Math.cos(angle) * spawnDist,
        y: cy + Math.sin(angle) * spawnDist,
        alive: true,
        reachedTower: false,
      };
    });
  }

  private getPlayfieldSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  private syncHud(): void {
    this.hud.setTowerHp(this.towerHp, PLACEHOLDER_BALANCE.tower.maxHp);
    this.hud.setShapeHp(
      this.shapes
        .filter((s) => s.alive)
        .map((s) => ({
          label: PLACEHOLDER_BALANCE.shapes[s.kind].label,
          hp: s.hp,
          maxHp: PLACEHOLDER_BALANCE.shapes[s.kind].hp,
          color: PLACEHOLDER_BALANCE.shapes[s.kind].color,
        })),
    );
  }

  private triggerGameOver(killerLabel: string): void {
    if (this.phase === 'gameover') {
      return;
    }
    this.phase = 'gameover';
    this.hud.root.hidden = true;
    this.gameOver.show(0, killerLabel);
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = this.lastTime === 0 ? 0 : Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    if (this.phase === 'playing' && dt > 0) {
      this.update(dt);
    }
    this.render();
  };

  private update(dt: number): void {
    const { width, height } = this.getPlayfieldSize();
    const cx = width / 2;
    const cy = height / 2;
    const reachDist =
      PLACEHOLDER_BALANCE.gun.towerRadius + PLACEHOLDER_BALANCE.gun.ringRadius * 0.35;

    this.fireCooldown -= dt;
    if (this.fireCooldown <= 0) {
      this.fireCooldown = PLACEHOLDER_BALANCE.gun.fireIntervalSec;
      this.spawnBullet(cx, cy);
    }

    for (const shape of this.shapes) {
      if (!shape.alive) {
        continue;
      }
      const dx = cx - shape.x;
      const dy = cy - shape.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = PLACEHOLDER_BALANCE.shapes[shape.kind].speed;
      shape.x += (dx / dist) * speed * dt;
      shape.y += (dy / dist) * speed * dt;

      if (!shape.reachedTower && dist <= reachDist) {
        shape.reachedTower = true;
        const damage = PLACEHOLDER_BALANCE.shapes[shape.kind].damage;
        this.towerHp = Math.max(0, this.towerHp - damage);
        shape.alive = false;
        this.syncHud();
        if (this.towerHp <= 0) {
          this.triggerGameOver(PLACEHOLDER_BALANCE.shapes[shape.kind].label);
          return;
        }
      }
    }

    const hitRadius = 22;
    const power = PLACEHOLDER_BALANCE.tower.power;
    const margin = 40;

    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i]!;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (
        bullet.x < -margin ||
        bullet.y < -margin ||
        bullet.x > width + margin ||
        bullet.y > height + margin
      ) {
        this.bullets.splice(i, 1);
        continue;
      }

      let consumed = false;
      for (const shape of this.shapes) {
        if (!shape.alive) {
          continue;
        }
        if (Math.hypot(bullet.x - shape.x, bullet.y - shape.y) <= hitRadius) {
          shape.hp -= power;
          if (shape.hp <= 0) {
            shape.alive = false;
          }
          consumed = true;
          this.syncHud();
          break;
        }
      }
      if (consumed) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private spawnBullet(cx: number, cy: number): void {
    const ring = PLACEHOLDER_BALANCE.gun.ringRadius;
    const muzzleX = cx + Math.cos(this.aimAngle) * ring;
    const muzzleY = cy + Math.sin(this.aimAngle) * ring;
    const speed = PLACEHOLDER_BALANCE.bullet.speed;
    this.bullets.push({
      x: muzzleX,
      y: muzzleY,
      vx: Math.cos(this.aimAngle) * speed,
      vy: Math.sin(this.aimAngle) * speed,
    });
  }

  private render(): void {
    const { width, height } = this.getPlayfieldSize();
    const cx = width / 2;
    const cy = height / 2;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#1a2332';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    const gridStep = 48;
    for (let x = 0; x <= width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, PLACEHOLDER_BALANCE.gun.ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#e8eef5';
    ctx.beginPath();
    ctx.arc(cx, cy, PLACEHOLDER_BALANCE.gun.towerRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    const gunX = cx + Math.cos(this.aimAngle) * PLACEHOLDER_BALANCE.gun.ringRadius;
    const gunY = cy + Math.sin(this.aimAngle) * PLACEHOLDER_BALANCE.gun.ringRadius;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(gunX, gunY);
    ctx.stroke();

    if (this.pointerTracking && this.phase === 'playing') {
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(
        cx + Math.cos(this.aimAngle) * Math.max(width, height),
        cy + Math.sin(this.aimAngle) * Math.max(width, height),
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (const shape of this.shapes) {
      if (!shape.alive) {
        continue;
      }
      const color = PLACEHOLDER_BALANCE.shapes[shape.kind].color;
      ctx.fillStyle = color;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.lineWidth = 2;

      if (shape.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (shape.kind === 'square') {
        ctx.fillRect(shape.x - 18, shape.y - 18, 36, 36);
        ctx.strokeRect(shape.x - 18, shape.y - 18, 36, 36);
      } else {
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y - 22);
        ctx.lineTo(shape.x + 20, shape.y + 16);
        ctx.lineTo(shape.x - 20, shape.y + 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    ctx.fillStyle = '#ffffff';
    for (const bullet of this.bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, PLACEHOLDER_BALANCE.bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private onResize = (): void => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.mount.clientWidth;
    const h = this.mount.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    this.canvas.remove();
  }
}
