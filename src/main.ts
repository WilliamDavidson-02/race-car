import * as THREE from "three";
import GUI from "lil-gui";

const canvas = document.querySelector("canvas");

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Debug
 */
const gui = new GUI({ width: 400 });
const debugObj = {};

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
  antialias: true,
});

renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const animate = (): void => {
  renderer.render(scene, camera);

  window.requestAnimationFrame(animate);
};

/**
 * Event listeners
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
