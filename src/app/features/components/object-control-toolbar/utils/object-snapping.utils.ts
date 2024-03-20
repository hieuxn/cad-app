import { Box2, Line, Object3D, Vector2, Vector3 } from "three";
import { QuadTree } from "../../../../core/models/quad-tree.model";

export class SnapData extends Vector2 {
  constructor(public parent: Object3D, x?: number, y?: number) {
    super(x, y);
  }
}

export class ObjectSnappingUtils {
  // TODO: bounding box detection
  private _maxSize: number = 500; // m
  private _capacity: number = 10;
  private _tolerance: number = 1E-3; // 1mm
  private _maxBoundingBox: Box2 = new Box2(new Vector2(-this._maxSize, -this._maxSize), new Vector2(this._maxSize, this._maxSize))
  private _quadTree: QuadTree<SnapData> = new QuadTree<SnapData>(this._maxBoundingBox, this._capacity, this._tolerance)
  private _object3ds: Object3D[] = [];

  insertLine(line: Line) {
    this._object3ds.push(line);
    const positions = line.geometry.getAttribute('position');
    let previousePoint: Vector3 | undefined = undefined;
    for (let i = 0; i < positions.count; i++) {
      const point = new Vector3().fromBufferAttribute(positions, i);
      this._quadTree.insert(new SnapData(line, point.x, point.y));

      if (undefined !== previousePoint) {
        const midPoint = new Vector3().addVectors(point, previousePoint).multiplyScalar(0.5);
        this._quadTree.insert(new SnapData(line, midPoint.x, midPoint.y));
      }
      previousePoint = point;
    }
  }

  // TODO: improve code
  removeLine(line: Line) {
    const positions = line.geometry.getAttribute('position');
    let previousePoint: Vector3 | undefined = undefined;
    for (let i = 0; i < positions.count; i++) {
      const point = new Vector3().fromBufferAttribute(positions, i);
      this._quadTree.remove(new SnapData(line, point.x, point.y));

      if (undefined !== previousePoint) {
        const midPoint = new Vector3().addVectors(point, previousePoint).multiplyScalar(0.5);
        this._quadTree.remove(new SnapData(line, midPoint.x, midPoint.y));
      }
      previousePoint = point;
    }
  }

  clear() {
    this._quadTree = new QuadTree<SnapData>(this._maxBoundingBox, this._capacity, this._tolerance);
  }

  query(boundingBox: Box2): SnapData[] {
    return this._quadTree.query(boundingBox);
  }
}