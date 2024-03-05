import { Vector3 } from "three";
import { DXFBase, UnitTypes } from "../common.model";

export class DXFHeader extends DXFBase {
  override className: string = 'HEADER';
  dimArrowSize: number = 0;
  measurement: number = 0;
  insUnits: UnitTypes = UnitTypes.Meters;
  extMin: Vector3 = new Vector3();
  extMax: Vector3 = new Vector3();
};