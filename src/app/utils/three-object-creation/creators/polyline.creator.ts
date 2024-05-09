import { BufferGeometry, Group, Line, LineBasicMaterial, Vector3 } from "three";


export class InstanceParameters {
  constructor(public points: Vector3[], public color: number) {
  }
}

// export class TypeParameter {
//   constructor(public manufacturer: string) {
//   }
// }

export interface Parameter {
  name: string;
  type: string;
  group: string;
  isInstance: boolean;
  value: string;
}

export interface UserData {
  familyCategory: string;
  familyName: string;
  familySymbolName: string;
  parameters: Parameter[];
}

export const defaultUserData: UserData = {
  familyCategory: 'Generic Models',
  familyName: 'Generic Family',
  familySymbolName: 'Generic Symbol',
  parameters: []
};

export class PolylineData implements UserData {
  constructor(public instance: InstanceParameters ) {
  }
  public familyCategory: string = 'Generic Models';
  public familyName: string = 'Generic Family';
  public familySymbolName: string = 'Generic Symbol';
  public parameters: Parameter[] = [];
}

export class PolylineCreator {
  readonly name = "Polyline";

  create(data: PolylineData): Group {
    const { points, color } = data.instance;

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
    if (!(group.userData instanceof PolylineData)) return group;
    const { points, color } = group.userData.instance;

    const [line] = group.children as [Line];
    const geometry = new BufferGeometry().setFromPoints(points);
    line.geometry.dispose();
    line.geometry = geometry;

    return group;
  }

  fixPosition(group: Group): Group {
    if (!(group.userData instanceof PolylineData)) return group;
    const { points, color } = group.userData.instance;
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