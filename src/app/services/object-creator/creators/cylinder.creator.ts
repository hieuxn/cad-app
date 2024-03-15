import { CylinderGeometry, Group, LineLoop, Mesh, MeshBasicMaterial, RingGeometry } from "three";

export class CylinderCreator {
  create(depth: number, radius: number, radialSegments: number = 32, color: number = 0x8888FF): Group {
    const geometry = new CylinderGeometry(radius, radius, depth, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshBasicMaterial({ color: color });
    const cylinder = new Mesh(geometry, material);

    const geometry2 = new RingGeometry(radius, radius, radialSegments);
    const material2 = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry2, material2);

    const group = new Group();
    group.add(cylinder);
    group.add(circleOutline);
    group.userData = { 'depth': depth, 'radius': radius, 'radialSegments': radialSegments, 'color': color };
    return group;
  }

  update(group: Group): Group {
    const depth = group.userData['depth'];
    const radius = group.userData['radius'];
    const radialSegments = group.userData['radialSegments'];
    const color = group.userData['color'];

    const oldCylinder = group.children[0] as Mesh;
    const geometry = new CylinderGeometry(radius, radius, depth, radialSegments);
    geometry.rotateX(Math.PI * 0.5);
    const material = new MeshBasicMaterial({ color: color });
    const cylinder = new Mesh(geometry, material);
    cylinder.position.copy(oldCylinder.position);
    cylinder.position.z = depth * -0.5;

    let positions = this.getSetBitPositions(oldCylinder.layers.mask);
    positions.forEach(pos => cylinder.layers.set(pos));

    const oldCircleOutline = group.children[1] as LineLoop;
    const geometry2 = new RingGeometry(radius, radius, radialSegments);
    const material2 = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry2, material2);
    circleOutline.position.copy(oldCircleOutline.position);

    positions = this.getSetBitPositions(oldCircleOutline.layers.mask);
    positions.forEach(pos => circleOutline.layers.set(pos));

    group.clear();
    group.add(cylinder);
    group.add(circleOutline);
    group.userData = { 'depth': depth, 'radius': radius, 'radialSegments': radialSegments, 'color': color };
    return group;
  }

  getSetBitPositions(mask: number): number[] {
    const positions = [];
    let position = 0;

    while (mask > 0) {
      if ((mask & 1) === 1) {
        positions.push(position);
      }
      mask >>= 1;
      position++;
    }

    return positions;
  }
}