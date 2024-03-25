import * as THREE from "three";

export const updateAllMaterials = (scene, intensity) => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material.isMeshStandardMaterial) {
      child.material.envMapIntensity = intensity;

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};
