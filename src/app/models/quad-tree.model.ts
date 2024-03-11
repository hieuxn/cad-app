import { Box2, Vector2 as T, Vector2 } from 'three';

export class QuadTree<T extends Vector2> {
  private _boundary: Box2;
  private _capacity: number;
  private _data: T[];
  private _divided: boolean;
  private _tolerance: number;
  private _toleranceSquared: number;

  private _northeast: QuadTree<T> | null = null;
  private _northwest: QuadTree<T> | null = null;
  private _southeast: QuadTree<T> | null = null;
  private _southwest: QuadTree<T> | null = null;

  constructor(boundary: Box2, capacity: number, tolerance: number) {
    this._boundary = boundary;
    this._capacity = capacity;
    this._data = [];
    this._divided = false;
    this._tolerance = tolerance;
    this._toleranceSquared = tolerance * tolerance;
  }

  insert(point: T): boolean {
    if (!this._boundary.containsPoint(point)) {
      return false;
    }

    if (this._data.length < this._capacity) {
      this._data.push(point);
      return true;
    }

    if (!this._divided) {
      this.subdivide();
    }

    if (this._northeast!.insert(point) || this._northwest!.insert(point) ||
      this._southeast!.insert(point) || this._southwest!.insert(point)) {
      return true;
    }

    // this should never happen
    return false;
  }

  subdivide(): void {
    let center = new T();
    this._boundary.getCenter(center);

    let ne = new Box2(new T(this._boundary.min.x, center.y), new T(center.x, this._boundary.max.y));
    let nw = new Box2(center, this._boundary.max);
    let se = new Box2(this._boundary.min, center);
    let sw = new Box2(new T(center.x, this._boundary.min.y), new T(this._boundary.max.x, center.y))

    this._northeast = new QuadTree(ne, this._capacity, this._tolerance);
    this._northwest = new QuadTree(nw, this._capacity, this._tolerance);
    this._southeast = new QuadTree(se, this._capacity, this._tolerance);
    this._southwest = new QuadTree(sw, this._capacity, this._tolerance);

    this._divided = true;
  }

  query(range: Box2, found: T[] = []): T[] {
    if (!this._boundary.intersectsBox(range) && !this._boundary.containsBox(range)) {
      return found;
    }

    for (let p of this._data) {
      if (range.containsPoint(p)) {
        found.push(p);
      }
    }

    if (!this._divided) {
      return found;
    }

    this._northwest!.query(range, found);
    this._northeast!.query(range, found);
    this._southwest!.query(range, found);
    this._southeast!.query(range, found);

    return found;
  }

  remove(point: T): boolean {
    if (!this._boundary.containsPoint(point)) {
      return false;
    }

    const index = this._data.findIndex(p => p.distanceToSquared(point) < this._toleranceSquared);
    if (index !== -1) {
      this._data.splice(index, 1);
      return true;
    }

    if (this._divided) {
      return this._northeast!.remove(point) || this._northwest!.remove(point) ||
        this._southeast!.remove(point) || this._southwest!.remove(point);
    }

    return false;
  }
}