import { CylinderGeometry, Group, LineLoop, Mesh, MeshBasicMaterial, MeshLambertMaterial, RingGeometry } from "three";
import { ThreeUtils } from "../../../../shared/utils/three.utils";

export class CylinderCreator {
  readonly name = "Cylinder";
  private _threeUtils = new ThreeUtils();

  create(depth: number, radius: number, radialSegments: number = 32, color: number = 0x8888FF): Group {
    const geometry = new CylinderGeometry(radius, radius, depth, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshLambertMaterial({ color: color });
    const cylinder = new Mesh(geometry, material);
    cylinder.layers.set(1);

    const geometry2 = new RingGeometry(radius, radius, radialSegments);
    const material2 = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry2, material2);

    const group = new Group();
    group.name = this.name;
    group.add(cylinder);
    group.add(circleOutline);
    group.userData = { 'depth': depth, 'radius': radius, 'radialSegments': radialSegments, 'color': color };
    return group;
  }

  update(group: Group): Group {
    const { depth, radius, radialSegments, color } = group.userData;

    const oldCylinder = group.children[0] as Mesh;
    const geometry = new CylinderGeometry(radius, radius, depth, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshLambertMaterial({ color: color });
    const cylinder = new Mesh(geometry, material);
    cylinder.position.copy(oldCylinder.position);
    cylinder.position.z = depth * -0.5;

    let positions = this._threeUtils.getSetBitPositions(oldCylinder.layers.mask);
    positions.forEach(pos => cylinder.layers.set(pos));

    const oldCircleOutline = group.children[1] as LineLoop;
    const geometry2 = new RingGeometry(radius, radius, radialSegments);
    const material2 = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry2, material2);
    circleOutline.position.copy(oldCircleOutline.position);

    positions = this._threeUtils.getSetBitPositions(oldCircleOutline.layers.mask);
    positions.forEach(pos => circleOutline.layers.set(pos));

    group.clear();
    group.add(cylinder);
    group.add(circleOutline);
    return group;
  }
}