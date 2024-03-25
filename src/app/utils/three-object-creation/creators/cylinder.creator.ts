import { CylinderGeometry, Group, LineLoop, Mesh, MeshBasicMaterial, MeshLambertMaterial, RingGeometry, Vector3 } from "three";
import { ThreeUtils } from "../../three.utils";

export class CylinderData {
  constructor(public depth: number, public radius: number, public radialSegments: number, public color: number) {
  }
}

export class CylinderCreator {
  readonly name = "Cylinder";
  private _threeUtils = new ThreeUtils();

  create(data: CylinderData): Group {
    const { depth, radius, radialSegments, color } = data;
    const geometry = new CylinderGeometry(radius, radius, depth, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshLambertMaterial({ color: color });
    const cylinder = new Mesh(geometry, material);

    cylinder.layers.set(1);

    const spawnPosition = new Vector3(0, 0, depth * -0.5);
    cylinder.position.copy(spawnPosition);

    const geometry2 = new RingGeometry(radius, radius, radialSegments);
    const material2 = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry2, material2);

    const group = new Group();
    group.name = this.name;
    group.add(cylinder);
    group.add(circleOutline);
    group.userData = data;
    return group;
  }

  temporarilyScale(group: Group): Group {
    const { depth, radius, radialSegments, color } = group.userData;

    const [cylinder, circle] = group.children as [Mesh, LineLoop]

    const cylinderGeometry = (cylinder.geometry as CylinderGeometry);
    const oldRadius = cylinderGeometry.parameters.radiusTop;
    const oldDepth = cylinderGeometry.parameters.height;
    const scale = radius / oldRadius;
    const scaleZ = depth / oldDepth;
    cylinder.scale.set(scale, scale, scaleZ);

    const ringGeometry = (circle.geometry as RingGeometry);
    const oldRingRadius = ringGeometry.parameters.innerRadius;
    const ringScale = radius / oldRingRadius;
    circle.scale.set(ringScale, ringScale, circle.scale.z);

    return group;
  }
}