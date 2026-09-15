import * as THREE from 'three';
import { COLORS, matteMaterial } from './materials';

export type EnvironmentObjects = {
  platform: THREE.Group;
  clouds: THREE.Group;
};

function createSkyGradient(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Texture();
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#5ec4ff');
  gradient.addColorStop(0.55, '#48b5ff');
  gradient.addColorStop(1, '#7ed0ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createCloud(seed: number): THREE.Group {
  const group = new THREE.Group();
  const puffMat = matteMaterial(COLORS.cloud, 0.95);
  const puffGeo = new THREE.SphereGeometry(1, 16, 16);
  const offsets: [number, number, number, number][] = [
    [0, 0, 0, 1.1],
    [-0.9, 0.15, 0.1, 0.85],
    [0.95, 0.1, -0.05, 0.9],
    [0.35, 0.35, 0.15, 0.65],
    [-0.35, -0.05, -0.2, 0.55],
  ];
  for (const [x, y, z, s] of offsets) {
    const puff = new THREE.Mesh(puffGeo, puffMat);
    puff.position.set(x * s, y * s, z * s);
    puff.scale.setScalar(s * (0.9 + (seed % 3) * 0.05));
    puff.castShadow = false;
    puff.receiveShadow = false;
    group.add(puff);
  }
  return group;
}

export function createEnvironment(scene: THREE.Scene): EnvironmentObjects {
  scene.background = createSkyGradient();

  const hemi = new THREE.HemisphereLight(0xbfe8ff, 0x3a4555, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(-6, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -4;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xdcecff, 0.35);
  fill.position.set(8, 6, -6);
  scene.add(fill);

  const platform = new THREE.Group();
  const platformMat = matteMaterial(COLORS.platform, 0.88);
  const topMat = matteMaterial(COLORS.platformTop, 0.86);

  const mainDeck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.9, 6.4), platformMat);
  mainDeck.position.set(0, -0.45, 0);
  mainDeck.castShadow = true;
  mainDeck.receiveShadow = true;
  platform.add(mainDeck);

  const step = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 6.4), topMat);
  step.position.set(-5.1, -0.72, 0);
  step.castShadow = true;
  step.receiveShadow = true;
  platform.add(step);

  scene.add(platform);

  const clouds = new THREE.Group();
  const cloudPlacements: [number, number, number, number][] = [
    [-9, 6.5, -14, 1.3],
    [4, 7.2, -16, 1.55],
    [11, 5.8, -12, 1.15],
    [-3, 8.5, -18, 1.75],
    [8, 9, -20, 1.4],
  ];
  cloudPlacements.forEach(([x, y, z, scale], index) => {
    const cloud = createCloud(index);
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    clouds.add(cloud);
  });
  scene.add(clouds);

  return { platform, clouds };
}

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(7.5, 4.2, 11.5);
  camera.lookAt(0.5, 2.2, 0);
  return camera;
}