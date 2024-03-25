import * as THREE from "three";
import * as CANNON from "cannon-es";
import { world } from "./world";
import { CarType } from "./types";

export let car: CarType;
export const wheels: THREE.Object3D[] = [];

export const createCar = (gltf: THREE.Object3D) => {
  let carModel: THREE.Object3D | undefined;

  gltf.traverse((child) => {
    if (child.name === "car") {
      carModel = child.children[0];
    } else if (child.name.startsWith("wheel")) {
      wheels.push(child);
    }
  });

  if (!carModel) return;

  // Car
  const shape = new CANNON.Box(new CANNON.Vec3(...carModel.scale));
  const body = new CANNON.Body({
    mass: 250,
  });
  body.addShape(shape);

  const vehicle = new CANNON.RaycastVehicle({
    chassisBody: body,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  vehicle.addToWorld(world);

  car = { gltf, vehicle };

  // Wheels
  const defaultWheelOptions = {
    radius: 0.35,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 55,
    suspensionRestLength: 0.02,
    frictionSlip: 30,
    dampingRelaxation: 2.3,
    dampingCompression: 4.3,
    maxSuspensionForce: 10000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(-1, 0, 0),
    maxSuspensionTravel: 1,
    customSlidingRotationalSpeed: 30,
  };

  // BL
  car.vehicle?.addWheel({
    ...defaultWheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(...wheels[0].position),
  });
  // BR
  car.vehicle?.addWheel({
    ...defaultWheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(...wheels[2].position),
  });
  // FL
  car.vehicle?.addWheel({
    ...defaultWheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(...wheels[1].position),
  });
  // FR
  car.vehicle?.addWheel({
    ...defaultWheelOptions,
    chassisConnectionPointLocal: new CANNON.Vec3(...wheels[3].position),
  });

  car.vehicle?.wheelInfos.forEach((wheel) => {
    const cylinder = new CANNON.Cylinder(
      wheel.radius,
      wheel.radius,
      wheel.radius / 2,
      20
    );
    const wheelBody = new CANNON.Body({
      mass: 1,
    });

    const quaternion = new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0);
    wheelBody.addShape(cylinder, new CANNON.Vec3(), quaternion);
  });

  // Wheels
};

export const moveCar = (direction: string) => {
  if (!car.vehicle) return;

  const maxSteerVal = 0.5;
  const maxForce = 750;
  const brakeForce = 36;
  const slowDownCar = 19.6;

  if (direction === "a") {
    car.vehicle.setSteeringValue(maxSteerVal * 1, 2);
    car.vehicle.setSteeringValue(maxSteerVal * 1, 3);
  } else if (direction === "d") {
    car.vehicle.setSteeringValue(maxSteerVal * -1, 2);
    car.vehicle.setSteeringValue(maxSteerVal * -1, 3);
  } else {
    car.vehicle.setSteeringValue(0, 2);
    car.vehicle.setSteeringValue(0, 3);
  }

  if (direction === "w") {
    car.vehicle.applyEngineForce(maxForce * -1, 0);
    car.vehicle.applyEngineForce(maxForce * -1, 1);
    car.vehicle.applyEngineForce(maxForce * -1, 2);
    car.vehicle.applyEngineForce(maxForce * -1, 3);
  } else if (direction === "s") {
    car.vehicle.applyEngineForce(maxForce * 1, 0);
    car.vehicle.applyEngineForce(maxForce * 1, 1);
    car.vehicle.applyEngineForce(maxForce * 1, 2);
    car.vehicle.applyEngineForce(maxForce * 1, 3);
  }
};
