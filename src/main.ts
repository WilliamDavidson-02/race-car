import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import GUI from "lil-gui";

import { updateAllMaterials } from "./utils.js";
import { DebugObjType } from "./types.js";

const canvas = document.querySelector("canvas");

let camera: THREE.PerspectiveCamera;

/**
 * Loaders
 */
const gltfLoader = new GLTFLoader();
const rgbeLoader = new RGBELoader();

/**
 * Scene
 */
const scene = new THREE.Scene();

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * Debug
 */
const gui = new GUI({ width: 400 });
const debugObj: DebugObjType = {
  envMapIntensity: 0.6,
};

gui
  .add(debugObj, "envMapIntensity", 0, 10, 0.001)
  .onChange(() => updateAllMaterials(scene, debugObj));

/**
 * Environment
 */
rgbeLoader.load("/sky.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;
});

/**
 * Models
 */
gltfLoader.load("/models/car.glb", (car) => {
  scene.add(car.scene);

  updateAllMaterials(scene, debugObj);
  camera.lookAt(car.scene.position);
});

/**
 * Meshes
 */
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(250, 250),
  new THREE.MeshStandardMaterial()
);

ground.rotation.x = -Math.PI * 0.5;

scene.add(ground);

/**
 * Camera
 */
camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100);

camera.position.set(5, 10, -15);

scene.add(camera);

/**
 * Lights
 */
const guiLights = gui.addFolder("Lights");

const directLight = new THREE.DirectionalLight(0xffffff, 1);
directLight.castShadow = true;
directLight.position.set(7, 6, 0.4);
directLight.shadow.camera.far = 15;
directLight.shadow.camera.near = 3;

guiLights
  .add(directLight, "intensity", 0, 10, 0.001)
  .name("directLigh-intensity");
guiLights.add(directLight.position, "x", -10, 10, 0.001).name("directLight-X");
guiLights.add(directLight.position, "y", -10, 10, 0.001).name("directLight-Y");
guiLights.add(directLight.position, "z", -10, 10, 0.001).name("directLight-Z");

// const directLightHelper = new THREE.CameraHelper(directLight.shadow.camera);

scene.add(directLight);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
});

renderer.shadowMap.enabled = true;
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
