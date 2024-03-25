import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";

import { updateAllMaterials } from "./utils.js";
import { DebugObjType } from "./types.js";
import { car, createCar, moveCar, wheels } from "./car.js";
import { createGround, world } from "./world.js";

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
gltfLoader.load("/models/car.glb", (gltf) => {
  scene.add(gltf.scene);
  createCar(gltf.scene);

  updateAllMaterials(scene, debugObj);
  camera.lookAt(gltf.scene.position);
});

/**
 * Ground
 */
createGround(scene);

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
directLight.shadow.mapSize.set(1024, 1024);
directLight.shadow.normalBias = 0.005;
directLight.shadow.bias = -0.002;

guiLights
  .add(directLight, "intensity", 0, 10, 0.001)
  .name("directLigh-intensity");
guiLights.add(directLight.position, "x", -10, 10, 0.001).name("directLight-X");
guiLights.add(directLight.position, "y", -10, 10, 0.001).name("directLight-Y");
guiLights.add(directLight.position, "z", -10, 10, 0.001).name("directLight-Z");
guiLights.add(directLight.shadow, "normalBias", -0.05, 0.05, 0.001);
guiLights.add(directLight.shadow, "bias", -0.05, 0.05, 0.001);

// const directLightHelper = new THREE.CameraHelper(directLight.shadow.camera);

scene.add(directLight);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas!,
  antialias: true,
});

renderer.shadowMap.enabled = true;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Orbitcontrolls
 */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enableRotate = true;

gui.add(controls, "enableRotate");

/**
 * Animate
 */
const clock = new THREE.Clock();
let oldElapsedTime = 0;

const animate = (): void => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = deltaTime;

  // Update physics world
  world.step(1 / 60, deltaTime, 3);

  if (car && car.gltf && car.vehicle) {
    car.gltf.position.copy(car.vehicle.chassisBody.position);
    car.gltf.quaternion.copy(car.vehicle.chassisBody.quaternion);

    for (let i = 0; i < 4; i++) {
      const wheel = car.vehicle.wheelInfos[i];
      if (!wheel) continue;

      car.vehicle.updateWheelTransform(i);
      wheels[i].position.copy(
        car.vehicle.wheelInfos[i].worldTransform.position
      );
      wheels[i].quaternion.copy(
        car.vehicle.wheelInfos[i].worldTransform.quaternion
      );
    }
  }

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

window.addEventListener("keydown", ({ key }) => moveCar(key));
