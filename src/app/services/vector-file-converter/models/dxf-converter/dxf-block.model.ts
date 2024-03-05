import { Object3D } from "three";
import { DXFBase } from "../common.model";
import { DXFEntity } from "./dxf-entity.model";

export class DXFBlock extends DXFBase {
  override className: string = 'BLOCK';
  entities: DXFEntity[] = [];
  xref: string = '';
  name: string = '';
  x: number = 0;
  y: number = 0;
  z: number = 0;
  paperSpace: number = 0;
  layout: string = '';
  // cached for INSERT
  object3Ds: Object3D[] = [];
}