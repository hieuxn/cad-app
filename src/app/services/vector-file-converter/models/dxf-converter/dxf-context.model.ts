import { Injector } from "@angular/core";
import { Vector3 } from "three";
import { LengthService } from "../../../length.service";
import { UnitTypes } from "../common.model";
import { DXFFile } from "./dxf-file.model";

export class DXFContext {
  private _unit: UnitTypes = UnitTypes.Meters;
  public data!: DXFFile;
  private lengthService: LengthService;
  public get unit(): UnitTypes { return this.data.header.insUnits }

  constructor(private injector: Injector) {
    this.lengthService = injector.get(LengthService);
  }

  public init(data: DXFFile) {
    this.data = data;
  }

  public fixLength(input: number | Vector3): number | Vector3 {
    if (input instanceof Vector3) {
      this.lengthService.fixVector3(input as Vector3, this.unit);
    }
    // else if (input as Partial<Point3D>) {
    //   this.lengthService.fixPartialPoint(input as Partial<Point3D>, this._unit);
    // }
    else input = this.lengthService.fixLength(input as number, this.unit);
    return input;
  }
}