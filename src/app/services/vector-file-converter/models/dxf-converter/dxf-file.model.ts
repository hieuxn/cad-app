import { DXFBase } from "../common.model";
import { DXFBlock } from "./dxf-block.model";
import { DXFEntity } from "./dxf-entity.model";
import { DXFHeader } from "./dxf-header.models";
import { DXFObject } from "./dxf-object.model";
import { DXFTable } from "./dxf-table.model";

export class DXFFile extends DXFBase {
  override className: string = 'FILE';
  header: DXFHeader = new DXFHeader();
  blocks: DXFBlock[] = [];
  entities: DXFEntity[] = [];
  tables: DXFTable[] = [];
  objects: DXFObject = new DXFObject();
}