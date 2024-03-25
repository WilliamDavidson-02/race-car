import * as THREE from "three";
import * as CANNON from "cannon-es";

export const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;

/**
 * Material
 */
const defaultMaterial = new CANNON.Material("default");

export const defaultContactMaterial = new CANNON.ContactMaterial(
  defaultMaterial,
  defaultMaterial,
  {
    friction: 0.1,
    restitution: 0.7,
  }
);

world.addContactMaterial(defaultContactMaterial);
world.defaultContactMaterial = defaultContactMaterial;

/**
 * Ground
 */
export const createGround = (scene: THREE.Scene) => {
  // Create Mesh
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(250, 250),
    new THREE.MeshStandardMaterial()
  );

  ground.rotation.x = -Math.PI * 0.5;

  scene.add(ground);

  // Create body
  const groundShape = new CANNON.Plane();
  const groundBody = new CANNON.Body({
    shape: groundShape,
  });

  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(-1, 0, 0),
    Math.PI * 0.5
  );
  groundBody.position.y = -1;

  world.addBody(groundBody);
};
