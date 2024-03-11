import { DxfGlobalObject, EntityCommons } from "@dxfjs/parser";
import { DxfBlock, DxfWriter, Units } from "@tarikjabiri/dxf";
import { Group, Material, Vector3 } from "three";
import { getLayerNameFromBlockName } from "../utils/block-name.utils";
import { LengthUtils } from "../utils/length.utils";
import { MaterialUtils } from "../utils/material.utils";

export interface DxfContext {
}

export class DxfParserContext implements DxfContext {
  private unit: Units;
  public groups: Map<string, Group> = new Map<string, Group>();

  constructor(public dxfObject: DxfGlobalObject,
    private lengthService: LengthUtils,
    private materialUtils: MaterialUtils) {
    this.unit = +dxfObject.header['$INSUNITS'];
  }

  fixLength(input: number): number {
    input = this.lengthService.fixLength(input as number, this.unit);
    return input;
  }

  fixLength3(input: Vector3): Vector3 {
    this.lengthService.fixLength3(input as Vector3, this.unit);
    return input;
  }

  getMaterial(context: DxfParserContext, entity: EntityCommons, ltype: string): Material {
    return this.materialUtils.getMaterial(context, entity, ltype);
  }
}

export class DxfWriterContext implements DxfContext {
  constructor(private materialUtils: MaterialUtils, public writer: DxfWriter | DxfBlock) {
    this.writer = writer;
  }

  createSubContext(group: Group): DxfWriterContext {
    if (!(this.writer instanceof DxfWriter)) throw new Error(`Can't create block in block`);
    const block = this.writer.addBlock(group.name);
    block.layerName = getLayerNameFromBlockName(group.name);
    return new DxfWriterContext(this.materialUtils, block);
  }

  getColorNumber(material: Material | Material[]): number {
    return this.materialUtils.getColorNumber(material);
  }
}