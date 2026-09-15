import * as CANNON from 'cannon-es';

export type PhysicsMaterials = {
  ball: CANNON.Material;
  block: CANNON.Material;
  platform: CANNON.Material;
};

export function createPhysicsMaterials(): PhysicsMaterials {
  return {
    ball: new CANNON.Material('ball'),
    block: new CANNON.Material('block'),
    platform: new CANNON.Material('platform'),
  };
}

export function registerContactMaterials(
  world: CANNON.World,
  materials: PhysicsMaterials,
): void {
  const stiffContact = {
    contactEquationStiffness: 1e8,
    contactEquationRelaxation: 3,
    frictionEquationStiffness: 1e8,
    frictionEquationRelaxation: 3,
  };

  world.addContactMaterial(
    new CANNON.ContactMaterial(materials.ball, materials.block, {
      friction: 0.42,
      restitution: 0.38,
      ...stiffContact,
    }),
  );

  world.addContactMaterial(
    new CANNON.ContactMaterial(materials.block, materials.block, {
      friction: 0.55,
      restitution: 0.12,
      ...stiffContact,
    }),
  );

  world.addContactMaterial(
    new CANNON.ContactMaterial(materials.ball, materials.platform, {
      friction: 0.35,
      restitution: 0.22,
      ...stiffContact,
    }),
  );

  world.addContactMaterial(
    new CANNON.ContactMaterial(materials.block, materials.platform, {
      friction: 0.62,
      restitution: 0.05,
      ...stiffContact,
    }),
  );

  world.defaultContactMaterial.friction = 0.5;
  world.defaultContactMaterial.restitution = 0.15;
  world.defaultContactMaterial.contactEquationStiffness = 1e8;
  world.defaultContactMaterial.contactEquationRelaxation = 3;
}
