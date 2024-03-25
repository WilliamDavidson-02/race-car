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

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.lookAt(new THREE.Vector3(0, 0, 0));
camera.position.set(0, 10, 5);

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
