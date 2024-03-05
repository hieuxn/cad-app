import { Injectable, inject } from "@angular/core";
import { Object3D } from "three";
import { GeneratorHelper } from "../../../../utils/generator.utils";
import { ConverterBaseService } from "../converter-base.service";
import { FileConverterBase } from "../file-converter-base.service";
import { DXFBlockConverter } from "./dxf-block.service";
import { DXFEntityConverter } from "./dxf-entity.service";
import { DXFHeaderConverter } from "./dxf-header.service";
import { DXFObjectConverter } from "./dxf-object.service";
import { DXFTableConverter } from "./dxf-table.service";

@Injectable({ providedIn: 'root' })
export class DXFConverterService extends FileConverterBase {
  // Order is important
  private map = new Map<string, ConverterBaseService>([
    ['HEADER', inject(DXFHeaderConverter)],
    ['TABLES', inject(DXFTableConverter)],
    ['BLOCKS', inject(DXFBlockConverter)],
    ['ENTITIES', inject(DXFEntityConverter)],
    ['OBJECTS', inject(DXFObjectConverter)],
  ]);

  constructor() {
    super()
  }

  public override async deserialize(file: File): Promise<Object3D[]> {
    const text = await this.readFileAsText(file, 'utf-8');
    const trimLines = text.split(/\r\n|\r|\n/g).map(line => line.trim());
    const iterator = GeneratorHelper.iterate(trimLines);
    const object3Ds: Object3D[] = [];
    let nextValue = '';

    while (true) {
      let num = +(iterator.next().value!);
      const converter = this.map.get(nextValue = iterator.next().value!);
      if (undefined === num || undefined === nextValue) break;
      if (undefined === converter) continue;
      const dxfs = converter.toDXFModel(iterator);
      const objects = converter.deserialize(GeneratorHelper.iterate(dxfs));
      if (undefined === objects || null === objects || objects.length === 0) continue;
      object3Ds.push(...objects);
    }

    return object3Ds;
  }

  public override async serialize(objects: Object3D[]): Promise<File> {
    let text: string[] = [];
    let iterator = GeneratorHelper.iterate(objects);
    let nextValue = '';

    for (const converter of this.map.values()) {
      const dxfs = converter.serialize(iterator);
      const strings = converter.toString(GeneratorHelper.iterate(dxfs));
      text.push(...strings);
    }

    const fileBlob = new Blob([text.join('\n')], { type: 'application/text' });
    const file = new File([fileBlob], "Export.dxf");
    return file;
  }
}