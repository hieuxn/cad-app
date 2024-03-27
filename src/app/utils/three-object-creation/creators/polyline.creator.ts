import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from "three";

export class PolylineData {
  constructor(public points: Vector3[], public color: number) {
  }
}

export class PolylineCreator {
  readonly name = "Polyline";

  create(data: PolylineData): Group {
    const { points, color } = data;

    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: color });
    const line = new Line(geometry, material);

    const polyline = new Group();
    polyline.add(line);
    polyline.name = this.name;
    polyline.userData = data;

    return polyline;
  }

  updatePoints(group: Group): Group {
    const { points, color } = group.userData;

    const [line] = group.children as [Line];
    const geometry = new BufferGeometry().setFromPoints(points);
    line.geometry.dispose();
    line.geometry = geometry;

    group.clear();
    group.add(line);

    return group;
  }
}