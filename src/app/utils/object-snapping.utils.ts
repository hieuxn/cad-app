import { Box2, Line, Object3D, Vector2, Vector3 } from "three";
import { QuadTreeRef } from "../models/quad-tree.model";

export class SnapData extends Vector2 {
  constructor(public ref: Object3D, x?: number, y?: number) {
    super(x, y);
  }
}

export class ObjectSnappingUtils {
  // TODO: bounding box detection
  private _maxSize: number = 500; // m
  private _capacity: number = 10;
  private _tolerance: number = 1E-3; // 1mm
  private _maxBoundingBox: Box2 = new Box2(new Vector2(-this._maxSize, -this._maxSize), new Vector2(this._maxSize, this._maxSize))
  private _quadTree: QuadTreeRef<SnapData> = new QuadTreeRef<SnapData>(this._maxBoundingBox, this._capacity, this._tolerance)
  private _minDistanceSquared = 0.2 * 0.2; // m

  insertLine(line: Line) {
    const positions = line.geometry.getAttribute('position');
    if (!positions) return;
    let previousePoint: Vector3 | undefined = undefined;
    for (let i = 0; i < positions.count; i++) {
      const point = line.localToWorld(new Vector3().fromBufferAttribute(positions, i));
      this._quadTree.insertRef( new SnapData(line, point.x, point.y));

      if (undefined !== previousePoint && point.distanceToSquared(previousePoint) > this._minDistanceSquared) {
        const midPoint = new Vector3().addVectors(point, previousePoint).multiplyScalar(0.5);
        this._quadTree.insertRef(new SnapData(line, midPoint.x, midPoint.y));
      }
      previousePoint = point;
    }
  }

  // TODO: improve code
  removeLine(line: Line) {
    this._quadTree.removeByRef(line);
  }

  clear() {
    this._quadTree = new QuadTreeRef<SnapData>(this._maxBoundingBox, this._capacity, this._tolerance);
  }

  query(boundingBox: Box2): SnapData[] {
    return this._quadTree.query(boundingBox);
  }
}