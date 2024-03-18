import { Group, Object3D, Scene } from "three";

export class ThreeUtils {
  public _getParentGroup(object: Object3D | null): Object3D | null {
    let parent = object;
    while (!!parent && !(parent.parent instanceof Scene)) {
      parent = parent.parent;
      if (parent instanceof Group) return parent;
    }
    return parent;
  }
}