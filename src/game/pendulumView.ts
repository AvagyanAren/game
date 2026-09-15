import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { COLORS, matteMaterial } from './materials';
import type { PendulumPhysics } from '../physics/pendulum';

const _anchor = new CANNON.Vec3();
const _ball = new CANNON.Vec3();
const _dir = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

export type PendulumView = {
  root: THREE.Group;
  ballMesh: THREE.Mesh;
  chainGroup: THREE.Group;
  linkTemplate: THREE.Mesh;
};

export function createPendulumView(pendulum: PendulumPhysics): PendulumView {
  const root = new THREE.Group();

  const ballMesh = new THREE.Mesh(
    new THREE.SphereGeometry(pendulum.ballRadius, 48, 48),
    matteMaterial(COLORS.ball, 0.78),
  );
  ballMesh.castShadow = true;
  ballMesh.receiveShadow = true;
  root.add(ballMesh);

  const chainGroup = new THREE.Group();
  const linkGeo = new THREE.TorusGeometry(0.11, 0.045, 8, 14);
  const linkMat = matteMaterial(COLORS.chain, 0.9);
  const linkTemplate = new THREE.Mesh(linkGeo, linkMat);
  linkTemplate.visible = false;
  chainGroup.add(linkTemplate);

  const linkCount = 14;
  for (let i = 0; i < linkCount; i += 1) {
    const link = linkTemplate.clone();
    link.visible = true;
    chainGroup.add(link);
  }

  root.add(chainGroup);

  return { root, ballMesh, chainGroup, linkTemplate };
}

export function syncPendulumView(view: PendulumView, pendulum: PendulumPhysics): void {
  const { ballBody, anchorBody, ropeLength } = pendulum;
  const anchor = anchorBody.position;
  const ball = ballBody.position;

  view.ballMesh.position.set(ball.x, ball.y, ball.z);
  view.ballMesh.quaternion.set(
    ballBody.quaternion.x,
    ballBody.quaternion.y,
    ballBody.quaternion.z,
    ballBody.quaternion.w,
  );

  _anchor.set(anchor.x, anchor.y, anchor.z);
  _ball.set(ball.x, ball.y, ball.z);

  const links = view.chainGroup.children.filter(
    (child: THREE.Object3D) => child !== view.linkTemplate,
  );
  const segment = ropeLength / (links.length + 0.5);

  for (let i = 0; i < links.length; i += 1) {    const t = (i + 1) / (links.length + 1);
    const link = links[i] as THREE.Mesh;
    link.position.set(
      anchor.x + (ball.x - anchor.x) * t,
      anchor.y + (ball.y - anchor.y) * t,
      anchor.z + (ball.z - anchor.z) * t,
    );

    _dir.set(ball.x - anchor.x, ball.y - anchor.y, ball.z - anchor.z).normalize();
    _quat.setFromUnitVectors(_up, _dir);
    link.quaternion.copy(_quat);
    link.rotateZ(i * 0.55);
    link.scale.set(1, 1, Math.min(1.15, segment * 1.4));
  }
}