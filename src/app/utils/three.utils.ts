import { Group, Object3D, Scene } from "three";

export class ThreeUtils {
  getParentGroup(object: Object3D | null): Object3D | null {
    let parent = object;
    while (!!parent && !(parent.parent instanceof Scene)) {
      parent = parent.parent;
      if (parent instanceof Group) return parent;
    }
    return parent;
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

  flatChildren(object: Object3D): Object3D[] {
    return object.children.flatMap(c => this.flatChildren(c).concat(c));
  }
}