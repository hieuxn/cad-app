import { Box2, Line, Vector2, Vector3 } from "three";
import { QuadTree } from "./quadtree.model";

export class ObjectSnapping {
  private maxSize: number = 500; // m
  private capacity: number = 10;
  private tolerance: number = 1E-3; // 1mm
  private maxBoundingBox: Box2 = new Box2(new Vector2(-this.maxSize, -this.maxSize), new Vector2(this.maxSize, this.maxSize))
  private quadTree: QuadTree = new QuadTree(this.maxBoundingBox, this.capacity, this.tolerance)

  public insertPoint(point: Vector2) {
    this.quadTree.insert(point);
  }

  public insertLine(line: Line) {
    const positions = line.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const point = new Vector3().fromBufferAttribute(positions, i);
      this.quadTree.insert(new Vector2(point.x, point.y));
    }
  }

  // TODO: improve code
  public removeLine(line: Line) {
    const positions = line.geometry.getAttribute('position');
    for (let i = 0; i < positions.count; i++) {
      const point = new Vector3().fromBufferAttribute(positions, i);
      this.quadTree.remove(new Vector2(point.x, point.y));
    }
  }

  public query(boundingBox: Box2): Vector2[] {
    return this.quadTree.query(boundingBox);
  }
}