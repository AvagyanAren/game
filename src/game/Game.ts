import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { createPhysicsWorld, createPlatformBody } from '../physics/world';
import {
  createPendulum,
  dampPendulum,
  nudgeSwing,
  resetPendulumState,
  setSwingMultiplier,
} from '../physics/pendulum';
import { createPedestalBodies, createTowerBlocks, type BlockEntity } from '../physics/blocks';
import { createEnvironment, createCamera } from './environment';
import { createPendulumView, syncPendulumView } from './pendulumView';
import { bindSwingControls } from './controls';
import { createCityView, removeBlockMesh, syncCityView, type CityView } from './cityView';
import {
  createRulesState,
  handleBlockContact,
  updateDifficulty,
  wakeUpperBlocks,
  type RulesState,
} from './rules';
import type { GameOverOverlay, ScorePill } from '../ui';
import {
  createGameOverOverlay,
  createScorePill,
  loadBestScore,
  saveBestScore,
  shareGameResult,
} from '../ui';
import { collapseRemainingTowers } from './collapse';
import {
  notifyGameplayStart,
  notifyGameplayStop,
  showGameOverInterstitial,
} from '../yandex';

const FIXED_STEP = 1 / 60;
const MAX_SUBSTEPS = 3;

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock = new THREE.Clock();
  private readonly world = createPhysicsWorld();
  private readonly pendulum = createPendulum(this.world);
  private readonly pendulumView = createPendulumView(this.pendulum);
  private readonly rules: RulesState = createRulesState();
  private readonly scorePill: ScorePill;
  private readonly gameOver: GameOverOverlay;
  private readonly mount: HTMLElement;
  private blocks: BlockEntity[] = [];
  private cityView: CityView | null = null;
  private blockByBody = new Map<CANNON.Body, BlockEntity>();
  private pedestalBodies: CANNON.Body[] = [];
  private unbindControls: (() => void) | null = null;
  private rafId = 0;
  private accumulator = 0;
  private bestScore = loadBestScore();

  constructor(mount: HTMLElement, uiRoot: HTMLElement) {
    this.mount = mount;
    this.scorePill = createScorePill(uiRoot);
    this.gameOver = createGameOverOverlay(uiRoot);
    this.gameOver.onRestart(() => {
      this.restartRound();
    });
    this.gameOver.onShare(() => {
      void this.shareRoundResult();
    });

    this.scene = new THREE.Scene();
    this.camera = createCamera();
    createEnvironment(this.scene);
    this.world.addBody(createPlatformBody());
    this.scene.add(this.pendulumView.root);
    this.spawnCity();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.mount.appendChild(this.renderer.domElement);

    this.world.addEventListener('beginContact', this.onBeginContact);
    this.bindControls();

    window.addEventListener('resize', this.onResize);
    this.onResize();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private bindControls(): void {
    this.unbindControls?.();
    this.unbindControls = bindSwingControls((direction) => {
      if (this.rules.phase !== 'playing') {
        return;
      }
      nudgeSwing(this.pendulum, direction);
    });
  }

  private spawnCity(): void {
    this.blocks = createTowerBlocks(this.world);
    this.pedestalBodies = createPedestalBodies(this.world);
    this.blockByBody.clear();
    for (const block of this.blocks) {
      this.blockByBody.set(block.body, block);
    }
    this.cityView = createCityView(this.blocks);
    this.scene.add(this.cityView.root);
  }

  private clearCity(): void {
    if (this.cityView) {
      this.scene.remove(this.cityView.root);
      this.cityView = null;
    }
    for (const block of this.blocks) {
      if (block.alive) {
        this.world.removeBody(block.body);
      }
    }
    for (const body of this.pedestalBodies) {
      this.world.removeBody(body);
    }
    this.blocks = [];
    this.pedestalBodies = [];
    this.blockByBody.clear();
  }

  private restartRound(): void {
    this.gameOver.hide();
    notifyGameplayStart();
    Object.assign(this.rules, createRulesState());
    setSwingMultiplier(1);
    resetPendulumState(this.pendulum, this.world);
    this.clearCity();
    this.spawnCity();
    this.scorePill.setScore(0);
    this.scorePill.root.hidden = false;
    this.bindControls();
  }

  private onBeginContact = (event: { bodyA: CANNON.Body; bodyB: CANNON.Body }): void => {
    handleBlockContact(
      this.rules,
      event,
      this.pendulum.ballBody,
      this.blockByBody,
      (block) => this.breakMintBlock(block),
      () => this.triggerGameOver(),
    );
  };

  private breakMintBlock(block: BlockEntity): void {
    if (!block.alive || this.rules.phase !== 'playing') {
      return;
    }
    block.alive = false;
    this.world.removeBody(block.body);
    this.blockByBody.delete(block.body);
    if (this.cityView) {
      removeBlockMesh(this.cityView, block);
    }
    wakeUpperBlocks(this.blocks, block);
    this.rules.score += 1;
    this.scorePill.setScore(this.rules.score);
  }

  private triggerGameOver(): void {
    if (this.rules.phase === 'gameover') {
      return;
    }
    this.rules.phase = 'gameover';
    collapseRemainingTowers(this.blocks, this.pendulum.ballBody);
    dampPendulum(this.pendulum);
    this.bestScore = saveBestScore(this.rules.score);
    this.renderer.render(this.scene, this.camera);
    this.scorePill.root.hidden = true;
    notifyGameplayStop();
    this.gameOver.show(this.rules.score, this.bestScore);
    void this.runGameOverInterstitial();
  }

  private async runGameOverInterstitial(): Promise<void> {
    await showGameOverInterstitial();
    this.gameOver.setRestartEnabled(true);
  }

  private async shareRoundResult(): Promise<void> {
    await shareGameResult(this.rules.score, () => this.captureScreenshot());
  }

  private captureScreenshot(): Promise<Blob | null> {
    const canvas = this.renderer.domElement;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.9);
    });
  }

  private syncScene(): void {
    syncPendulumView(this.pendulumView, this.pendulum);
    if (this.cityView) {
      syncCityView(this.cityView, this.blocks);
    }
  }

  private onResize = (): void => {
    const { clientWidth, clientHeight } = this.mount;
    this.camera.aspect = clientWidth / Math.max(clientHeight, 1);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  private tick = (): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.accumulator += delta;

    const swingMult = updateDifficulty(this.rules, delta);
    setSwingMultiplier(swingMult);

    if (this.rules.phase === 'gameover') {
      dampPendulum(this.pendulum);
    }

    while (this.accumulator >= FIXED_STEP) {
      this.world.step(FIXED_STEP, FIXED_STEP, MAX_SUBSTEPS);
      this.accumulator -= FIXED_STEP;
    }

    this.syncScene();
    this.renderer.render(this.scene, this.camera);
  };

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.unbindControls?.();
    window.removeEventListener('resize', this.onResize);
    this.world.removeEventListener('beginContact', this.onBeginContact);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
