import * as THREE from "three";
import { DebugObjType } from "./types";

export const updateAllMaterials = (
  scene: THREE.Scene,
  debugObj: DebugObjType
) => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material.isMeshStandardMaterial) {
      child.material.envMapIntensity = debugObj.envMapIntensity;

      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
};
