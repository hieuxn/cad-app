import { Units } from "@tarikjabiri/dxf";
import { Vector3 } from "three";

export class LengthUtils {
  public fixLength(number: number, unit: Units): number {
    return this.toMeters(number, unit);
  }

  public fixLength3(point3D: Vector3, unit: Units) {
    point3D.x = this.toMeters(point3D.x, unit);
    point3D.y = this.toMeters(point3D.y, unit);
    point3D.z = this.toMeters(point3D.z, unit);
  }

  public toMeters(length: number, unit: Units): number {
    switch (unit) {
      case Units.Millimeters: return length * 1E-3;
      default: return length;
    }
  }
}