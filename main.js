import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.querySelector("canvas");

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Utils
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * World
 */
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

const worldDebugger = CannonDebugger(scene, world);

// floor
const floorBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});

floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // make it face up
world.addBody(floorBody);

// Build the car chassis
const chassisShape = new CANNON.Box(new CANNON.Vec3(2, 0.5, 1));
const chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 3, 0);
chassisBody.angularVelocity.set(0, 0.5, 0);
world.addBody(chassisBody);

// Create the vehicle
const vehicle = new CANNON.RaycastVehicle({
  chassisBody,
});

const wheelOptions = {
  radius: 0.5,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 30,
  suspensionRestLength: 0.3,
  frictionSlip: 1.4,
  dampingRelaxation: 2.3,
  dampingCompression: 4.4,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(0, 0, 1),
  chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, 1),
  maxSuspensionTravel: 0.3,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

wheelOptions.chassisConnectionPointLocal.set(-1, -0.2, 1);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(-1, -0.2, -1);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(1, -0.2, 1);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(1, -0.2, -1);
vehicle.addWheel(wheelOptions);

vehicle.addToWorld(world);

// Add the wheel bodies
const wheelBodies = [];
const wheelMaterial = new CANNON.Material("wheel");
vehicle.wheelInfos.forEach((wheel) => {
  const cylinderShape = new CANNON.Cylinder(
    wheel.radius,
    wheel.radius,
    wheel.radius / 2,
    20
  );
  const wheelBody = new CANNON.Body({
    mass: 0,
    material: wheelMaterial,
  });
  wheelBody.type = CANNON.Body.KINEMATIC;
  wheelBody.collisionFilterGroup = 0; // turn off collisions
  const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
  wheelBody.addShape(cylinderShape, new CANNON.Vec3(), quaternion);
  wheelBodies.push(wheelBody);
  world.addBody(wheelBody);
  world.addBody(wheelBody);
});

// Update the wheel bodies
world.addEventListener("postStep", () => {
  for (let i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    const transform = vehicle.wheelInfos[i].worldTransform;
    const wheelBody = wheelBodies[i];
    wheelBody.position.copy(transform.position);
    wheelBody.quaternion.copy(transform.quaternion);
  }
});

// Add the ground
const sizeX = 64;
const sizeZ = 64;
const matrix = [];
for (let i = 0; i < sizeX; i++) {
  matrix.push([]);
  for (let j = 0; j < sizeZ; j++) {
    if (i === 0 || i === sizeX - 1 || j === 0 || j === sizeZ - 1) {
      const height = 3;
      matrix[i].push(height);
      continue;
    }

    const height =
      Math.cos((i / sizeX) * Math.PI * 5) *
        Math.cos((j / sizeZ) * Math.PI * 5) *
        2 +
      2;
    matrix[i].push(height);
  }
}

const groundMaterial = new CANNON.Material("ground");
const heightfieldShape = new CANNON.Heightfield(matrix, {
  elementSize: 100 / sizeX,
});
const heightfieldBody = new CANNON.Body({ mass: 0, material: groundMaterial });
heightfieldBody.addShape(heightfieldShape);
heightfieldBody.position.set(
  // -((sizeX - 1) * heightfieldShape.elementSize) / 2,
  -(sizeX * heightfieldShape.elementSize) / 2,
  -1,
  // ((sizeZ - 1) * heightfieldShape.elementSize) / 2
  (sizeZ * heightfieldShape.elementSize) / 2
);
heightfieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(heightfieldBody);

// Define interactions between wheels and ground
const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 0.3,
  restitution: 0,
  contactEquationStiffness: 1000,
});
world.addContactMaterial(wheel_ground);

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  200
);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.position.set(20, 10, 20);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Orbit controls
 */
const controls = new OrbitControls(camera, renderer.domElement);

/**
 * Animation
 */
const animate = () => {
  world.fixedStep();

  controls.update();

  worldDebugger.update();

  renderer.render(scene, camera);

  requestAnimationFrame(animate);
};

/**
 * Eventlistener
 */
window.addEventListener("DOMContentLoaded", animate);

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Keybindings
// Add force on keydown
document.addEventListener("keydown", (event) => {
  const maxSteerVal = 0.5;
  const maxForce = 500;
  const brakeForce = 1000000;

  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.applyEngineForce(-maxForce, 2);
      vehicle.applyEngineForce(-maxForce, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.applyEngineForce(maxForce, 2);
      vehicle.applyEngineForce(maxForce, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(maxSteerVal, 0);
      vehicle.setSteeringValue(maxSteerVal, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(-maxSteerVal, 0);
      vehicle.setSteeringValue(-maxSteerVal, 1);
      break;

    case "b":
      vehicle.setBrake(brakeForce, 0);
      vehicle.setBrake(brakeForce, 1);
      vehicle.setBrake(brakeForce, 2);
      vehicle.setBrake(brakeForce, 3);
      break;
  }
});

// Reset force on keyup
document.addEventListener("keyup", (event) => {
  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.applyEngineForce(0, 2);
      vehicle.applyEngineForce(0, 3);
      break;

    case "a":
    case "ArrowLeft":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "d":
    case "ArrowRight":
      vehicle.setSteeringValue(0, 0);
      vehicle.setSteeringValue(0, 1);
      break;

    case "b":
      vehicle.setBrake(0, 0);
      vehicle.setBrake(0, 1);
      vehicle.setBrake(0, 2);
      vehicle.setBrake(0, 3);
      break;
  }
});
