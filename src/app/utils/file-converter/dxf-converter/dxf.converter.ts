import { Parser } from '@dxfjs/parser';
import { DxfWriter, Units } from '@tarikjabiri/dxf';
import { Group, Object3D } from 'three';
import { BaseConverter } from '../base.converter';
import { deserializeEntities, serializeEntities } from './entities-converters/dxf-entities.converter';
import { DxfParserContext, DxfWriterContext } from './models/dxf-context.model';
import { ColorUtils } from './utils/color.utils';
import { LengthUtils } from './utils/length.utils';
import { MaterialUtils } from './utils/material.utils';

export class DXFConverter extends BaseConverter {
  private _lengthUtils: LengthUtils = new LengthUtils();
  private _materialUtils: MaterialUtils = new MaterialUtils(new ColorUtils());

  override async deserialize(file: File): Promise<Object3D[]> {
    const text = await this.readFileAsText(file, 'utf-8');
    return this._deserialize(text);
  }

  override async serialize(objects: Object3D[]): Promise<File> {
    const text = await this._serialize(objects);
    const fileBlob = new Blob([text], { type: 'application/text' });
    const file = new File([fileBlob], "Export.dxf");
    return file;
  }

  async _deserialize(text: string): Promise<Object3D[]> {
    const dxfObjects = await new Parser().parse(text);
    // const str = JSON.stringify(dxfObjects, null, 2);
    const object3Ds: Object3D[] = [];
    const context = new DxfParserContext(dxfObjects, this._lengthUtils, this._materialUtils);

    for (const block of dxfObjects.blocks) {
      const group = new Group();
      group.position.set(block.basePointX, block.basePointY, block.basePointZ);
      group.name = block.name;
      const objects = deserializeEntities(context, block.entities);
      if (objects.length !== 0) group.add(...objects);
      context.groups.set(group.name, group);
    }

    const objects = deserializeEntities(context, dxfObjects.entities);
    object3Ds.push(...objects);

    return object3Ds;
  }

  async _serialize(objects: Object3D[]): Promise<string> {
    const writer = new DxfWriter();
    const context = new DxfWriterContext(this._materialUtils, writer);
    writer.setUnits(Units.Meters);
    writer.addLayer('myDefaultLayer', 0xFF0000);

    serializeEntities(context, objects);

    const text = writer.stringify();
    return text;
  }
}
