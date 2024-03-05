import { Injectable } from "@angular/core";
import { Vector3 } from "three";
import { UnitTypes } from "./vector-file-converter/models/common.model";

@Injectable({ providedIn: 'root' })
export class LengthService {
  public fixLength(number: number, unit: UnitTypes): number {
    return this.toMeters(number, unit);
  }

  // public fixPartialPoint(point3D: Partial<Vector3>, unit: UnitTypes) {
  //   if (point3D.x) point3D.x = this.toMeters(point3D.x, unit);
  //   if (point3D.y) point3D.y = this.toMeters(point3D.y, unit);
  //   if (point3D.z) point3D.z = this.toMeters(point3D.z, unit);
  // }

  public fixVector3(point3D: Vector3, unit: UnitTypes) {
    point3D.x = this.toMeters(point3D.x, unit);
    point3D.y = this.toMeters(point3D.y, unit);
    point3D.z = this.toMeters(point3D.z, unit);
  }

  public toMeters(length: number, unit: UnitTypes): number {
    switch (unit) {
      case UnitTypes.Millimeters: return length * 1E-3;
      default: return length;
    }
  }
}

export class LengthHelper {
}