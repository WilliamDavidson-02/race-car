import * as THREE from "three";
import * as CANNON from "cannon-es";
import CannonDebugger from "cannon-es-debugger";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader";
import { RGBELoader } from "three/addons/loaders/RGBELoader";
import { updateAllMaterials } from "./threeHelper";

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
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

/**
 * World
 */
const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
});

const worldDebugger = CannonDebugger(scene, world);

// Build the car chassis
const chassiDimentions = {
  width: 0.8,
  height: 0.4,
  depth: 1.1,
};

const chassisModelPos = {
  x: 0.35,
  y: -0.4,
  z: -0.22,
};

const chassisShape = new CANNON.Box(
  new CANNON.Vec3(
    chassiDimentions.depth,
    chassiDimentions.height,
    chassiDimentions.width
  )
);
const chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 1, 0);
// chassisBody.angularVelocity.set(0, 0.5, 0);
world.addBody(chassisBody);

// Create the vehicle
const vehicle = new CANNON.RaycastVehicle({
  chassisBody,
});

const wheelOptions = {
  radius: 0.16,
  suspensionStiffness: 40,
  suspensionRestLength: 0.12,
  frictionSlip: 4,
  dampingRelaxation: 1.5,
  dampingCompression: 1.5,
  maxSuspensionForce: 100000,
  rollInfluence: 0.01,
  maxSuspensionTravel: 0.15,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  axleLocal: new CANNON.Vec3(0, 0, 1),
  chassisConnectionPointLocal: new CANNON.Vec3(-1, 0, chassiDimentions.width),
};

wheelOptions.chassisConnectionPointLocal.set(-0.85, -0.3, 0.7);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(-0.85, -0.3, -0.7);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(0.61, -0.3, 0.7);
vehicle.addWheel(wheelOptions);

wheelOptions.chassisConnectionPointLocal.set(0.61, -0.3, -0.7);
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

const groundMaterial = new CANNON.Material("ground");
const fieldShape = new CANNON.Plane();
const fieldBody = new CANNON.Body({ mass: 0, material: groundMaterial });
fieldBody.addShape(fieldShape);
fieldBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
world.addBody(fieldBody);

// Define interactions between wheels and ground
const wheel_ground = new CANNON.ContactMaterial(wheelMaterial, groundMaterial, {
  friction: 0.8,
  restitution: 0.2,
  contactEquationStiffness: 1000,
});
world.addContactMaterial(wheel_ground);

/**
 * Models
 */
let car;
gltfLoader.load("/race_car.glb", (gltf) => {
  car = gltf.scene;

  gltf.scene.position.copy(chassisBody.position);

  updateAllMaterials(scene, 0.5);

  scene.add(gltf.scene);
});

/**
 * Environment
 */
rgbeLoader.load("/sunset_01.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  // scene.background = environmentMap;
  scene.environment = environmentMap;
});

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
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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

  // Update vehicle
  if (car) {
    car.position.set(
      chassisBody.position.x + chassisModelPos.x,
      chassisBody.position.y + chassisModelPos.y,
      chassisBody.position.z + chassisModelPos.z
    );
    car.quaternion.copy(chassisBody.quaternion);
  }

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
  const brakeForce = 5;

  switch (event.key) {
    case "w":
    case "ArrowUp":
      vehicle.applyEngineForce(-maxForce, 2);
      vehicle.applyEngineForce(-maxForce, 3);
      break;

    case "s":
    case "ArrowDown":
      vehicle.applyEngineForce(maxForce * 0.5, 2);
      vehicle.applyEngineForce(maxForce * 0.5, 3);
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
