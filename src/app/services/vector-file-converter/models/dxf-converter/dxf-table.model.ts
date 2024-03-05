import { Vector2 } from "three";
import { DXFBase } from "../common.model";

export class DXFTable extends DXFBase{
  override className: string = 'TABLE';
  ltypes: Map<string, DXFLineType> = new Map<string, DXFLineType>();
  layers: Map<string, DXFLayer> = new Map<string, DXFLayer>();
  vports: Map<string, DXFViewport> = new Map<string, DXFViewport>();
  styles: Map<string, DXFStyle> = new Map<string, DXFStyle>();
};

export class DXFLayer extends DXFBase {
  override className: string = 'LAYER';
  type: string = '';
  name: string = '';
  flags: number = 0;
  colorNumber: number = 0;
  lineTypeName: string = '';
  lineWeightEnum: string = '';
  plot: boolean = false;
}

export class DXFLinePattern {
  length: number = 0;
  shape: number = 0;
  shapeNumber: number = 0;
  styleHandle: string = '';
  scales: number[] = []
  rotation: number = 0;
  offset: Vector2 = new Vector2();
  text: string = '';
}

export class DXFLineType extends DXFBase {
  override className: string = 'LTYPE';
  type: string = '';
  pattern: DXFLinePattern[] = [];
  name: string = '';
  flag: number = 0;
  description: string = '';
  alignment: number = 0;
  elementCount: number = 0;
  patternLength: number = 0;
}

export class DXFViewport extends DXFBase{
  override className: string = 'VPORT';
  name: string = '';
}

export class DXFStyle extends DXFBase{
  override className: string = 'STYLE';
  name: string = '';
}