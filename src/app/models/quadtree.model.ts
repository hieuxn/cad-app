import { Box2, Vector2 } from 'three';

export class QuadTree {
  boundary: Box2;
  capacity: number;
  points: Vector2[];
  divided: boolean;

  northeast: QuadTree | null = null;
  northwest: QuadTree | null = null;
  southeast: QuadTree | null = null;
  southwest: QuadTree | null = null;

  public constructor(boundary: Box2, capacity: number) {
    this.boundary = boundary;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  public insert(point: Vector2): boolean {
    if (!this.boundary.containsPoint(point)) {
      return false;
    }

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (this.northeast!.insert(point) || this.northwest!.insert(point) ||
      this.southeast!.insert(point) || this.southwest!.insert(point)) {
      return true;
    }

    // this should never happen
    return false;
  }

  public subdivide(): void {
    let center = new Vector2();
    this.boundary.getCenter(center);

    let ne = new Box2(new Vector2(this.boundary.min.x, center.y), new Vector2(center.x, this.boundary.max.y));
    let nw = new Box2(center, this.boundary.max);
    let se = new Box2(this.boundary.min, center);
    let sw = new Box2(new Vector2(center.x, this.boundary.min.y), new Vector2(this.boundary.max.x, center.y))

    this.northeast = new QuadTree(ne, this.capacity);
    this.northwest = new QuadTree(nw, this.capacity);
    this.southeast = new QuadTree(se, this.capacity);
    this.southwest = new QuadTree(sw, this.capacity);

    this.divided = true;
  }

  public query(range: Box2, found: Vector2[] = []): Vector2[] {
    if (!this.boundary.intersectsBox(range) && !this.boundary.containsBox(range)) {
      return found;
    }

    for (let p of this.points) {
      if (range.containsPoint(p)) {
        found.push(p);
      }
    }

    if (!this.divided) {
      return found;
    }

    this.northwest!.query(range, found);
    this.northeast!.query(range, found);
    this.southwest!.query(range, found);
    this.southeast!.query(range, found);

    return found;
  }

  public remove(point: Vector2): boolean {
    if (!this.boundary.containsPoint(point)) {
      return false;
    }

    const index = this.points.findIndex(p => p.x === point.x && p.y === point.y);
    if (index !== -1) {
      this.points.splice(index, 1);
      return true;
    }

    if (this.divided) {
      return this.northeast!.remove(point) || this.northwest!.remove(point) ||
        this.southeast!.remove(point) || this.southwest!.remove(point);
    }

    return false;
  }
}