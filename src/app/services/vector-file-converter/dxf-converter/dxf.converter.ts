import { Parser } from "@dxfjs/parser";
import { DxfWriter, Units } from "@tarikjabiri/dxf";
import { Group, Object3D } from "three";
import { BaseConverter } from "../base-converter.service";
import { deserializeEntities, serializeEntities } from "./entities-converters/dxf-entities.converter";
import { DxfParserContext, DxfWriterContext } from "./models/dxf-context.model";
import { ColorUtils } from "./utils/color.utils";
import { LengthUtils } from "./utils/length.utils";
import { MaterialUtils } from "./utils/material.utils";

export class DXFConverter extends BaseConverter {
  public map!: Map<string, (context: any, obj: any) => any>;
  private lengthUtils: LengthUtils = new LengthUtils();
  private materialUtils: MaterialUtils = new MaterialUtils(new ColorUtils());

  public override async deserialize(file: File): Promise<Object3D[]> {
    const text = await this.readFileAsText(file, 'utf-8');
    const dxfObjects = await new Parser().parse(text);

    const object3Ds: Object3D[] = [];
    const context = new DxfParserContext(dxfObjects, this.lengthUtils, this.materialUtils);

    for (const block of dxfObjects.blocks) {
      const group = new Group();
      group.position.set(block.basePointX, block.basePointY, block.basePointZ);
      group.name = block.name;
      const objects = deserializeEntities(context, block.entities);
      group.children.push(...objects);
      context.groups.set(group.name, group);
    }

    const objects = deserializeEntities(context, dxfObjects.entities);
    object3Ds.push(...objects);

    return object3Ds;
  }

  public override async serialize(objects: Object3D[]): Promise<File> {
    const writer = new DxfWriter();
    const context = new DxfWriterContext(this.materialUtils, writer);
    writer.setUnits(Units.Meters);
    writer.addLayer('myDefaultLayer', 0xFF0000);

    serializeEntities(context, objects);

    const fileBlob = new Blob([writer.stringify()], { type: 'application/text' });
    const file = new File([fileBlob], "Export.dxf");
    return file;
  }
}