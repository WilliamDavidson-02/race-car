import { RaycastVehicle } from "cannon-es";
import { Object3D } from "three";

export type DebugObjType = {
  envMapIntensity: number;
};

export type CarType = {
  gltf: Object3D | undefined;
  vehicle: RaycastVehicle | undefined;
};
