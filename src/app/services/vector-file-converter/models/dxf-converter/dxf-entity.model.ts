import { Vector3 } from "three";
import { DXFBase, UnitTypes } from "../common.model";

export class DXFEntity extends DXFBase {
  override className: string = 'ENTITY';
  layer: string = '';
  lineTypeScale: any;
  lineTypeName: string = '';
  visible: boolean = false;
  colorNumber: number = 0;
  extrusionX: any;
  extrusionY: any;
  extrusionZ: any;
  insUnit: UnitTypes = UnitTypes.Meters;
  fillColor: number = 0;
  type: string = '';
}

export class DXFLine extends DXFEntity {
  override className: string = 'LINE';
  start: Vector3 = new Vector3;
  end: Vector3 = new Vector3;
  thickness: number = 0;
}

export class DXFInsert extends DXFEntity {
  override className: string = 'INSERT';
  block: string = '';
  x: number = 0;
  y: number = 0;
  z: number = 0;
  scaleX: number = 1;
  scaleY: number = 1;
  scaleZ: number = 1;
  columnSpacing: number = 0;
  rowSpacing: number = 0;
  rotation: number = 0;
  columnCount: number = 0;
  rowCount: number = 0;
}

