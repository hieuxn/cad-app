import { DXFBase } from "../common.model";

export class DXFObject extends DXFBase {
  override className: string = 'OBJECT';
  layouts: DXFLayout[] = []
}

export enum UCSType {
  NOT_ORTHOGRAPHIC = 0,
  TOP = 1,
  BOTTOM = 2,
  FRONT = 3,
  BACK = 4,
  LEFT = 5,
  RIGHT = 6
}

export class DXFLayout extends DXFBase {
  override className: string = 'LAYOUT';
  name: string = '';
  handle: string = '';
  minLimitX: number = 0;
  minLimitY: number = 0;
  maxLimitX: number = 0;
  maxLimitY: number = 0;
  x: number = 0;
  y: number = 0;
  z: number = 0;
  minX: number = 0;
  minY: number = 0;
  minZ: number = 0;
  maxX: number = 0;
  maxY: number = 0;
  maxZ: number = 0;
  flag: 'PSLTSCALE' | 'LIMCHECK' = 'LIMCHECK';
  tabOrder: string = '';
  evelvation: number = 0;
  ucsX: number = 0;
  ucsY: number = 0;
  ucsZ: number = 0;
  ucsXaxisX: number = 0;
  ucsXaxisY: number = 0;
  ucsXaxisZ: number = 0;
  ucsYaxisX: number = 0;
  ucsYaxisY: number = 0;
  ucsYaxisZ: number = 0;
  ucsType: UCSType = UCSType.NOT_ORTHOGRAPHIC;
  tableRecord: string = ''
  lastActiveViewport: string = ''
  shadePlot: string = ''
}