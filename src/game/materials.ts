import * as THREE from 'three';

export function matteMaterial(color: number, roughness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.04,
  });
}

export const COLORS = {
  ball: 0x141418,
  chain: 0x3a3a42,
  platform: 0x252f3f,
  platformTop: 0x2c3648,
  cloud: 0xf8f9fc,
  mint: 0x7fe5ad,
  coral: 0xf67262,
  pedestal: 0x343c48,
} as const;