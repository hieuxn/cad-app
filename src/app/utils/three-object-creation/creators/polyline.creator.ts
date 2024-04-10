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

    return group;
  }

  fixPosition(group: Group): Group {
    const { points, color } = group.userData;
    const typedPoints: THREE.Vector3[] = points as THREE.Vector3[];

    const center = new Vector3();
    for (const point of typedPoints) {
      center.add(point);
    }

    center.divideScalar(typedPoints.length);

    typedPoints.forEach(p => p.sub(center));

    const [line] = group.children as [Line];
    const geometry = new BufferGeometry().setFromPoints(typedPoints);
    line.geometry.dispose();
    line.geometry = geometry;

    group.position.copy(center);
    
    return group;
  }
}