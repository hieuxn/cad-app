import { Injectable, inject } from "@angular/core";
import { Line, Object3D } from "three";
import { GeneratorHelper } from "../../../../utils/generator.utils";
import { DXFBase } from "../../models/common.model";
import { ConverterBaseService } from "../converter-base.service";
import { DXFInsertConverterService } from "./dxf-entities/dxf-insert-converter.service";
import { DXFLineConverterService } from "./dxf-entities/dxf-line-converter.service";

@Injectable({ providedIn: 'root' })
export class DXFEntityConverter extends ConverterBaseService {
  private deserializeMap: Map<string, ConverterBaseService> = new Map<string, ConverterBaseService>([
    ['LINE', inject(DXFLineConverterService)],
    ['INSERT', inject(DXFInsertConverterService)],
  ]);

  private serializeMap: Map<string, ConverterBaseService> = new Map<string, ConverterBaseService>([
    [Line.name, inject(DXFLineConverterService)],
  ]);

  public override toDXFModel(iterator: Generator<string>): DXFBase[] {
    const objects: DXFBase[] = [];
    let currentValue = '';

    for (const currentValue of iterator) {
      const converter = this.deserializeMap.get(currentValue);
      if (undefined === currentValue) break;
      const objs = converter?.toDXFModel(iterator);
      if (undefined === objs || null === objs) continue;
      objects.push(...objs);
    }

    return objects;
  }

  public override toString(iterator: Generator<DXFBase>): string[] {
    return [];
  }

  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    const object3Ds: Object3D[] = [];
    let currentValue: DXFBase;

    for (const currentValue of iterator) {
      const converter = this.deserializeMap.get(currentValue.className);
      if (undefined === currentValue) break;
      const objects = converter?.deserialize(GeneratorHelper.convert(currentValue));
      if (undefined === objects || null === objects) continue;
      object3Ds.push(...objects);
    }

    return object3Ds;
  }
  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    const text: string[] = [];

    text.push('0', 'SECTION')
    text.push('2', 'ENTITIES')

    for (const obj of iterator) {
      const dxfs = this.serializeMap.get(obj.type)?.serialize(GeneratorHelper.convert(obj));
      if (undefined === dxfs) continue;
      const strings = this.serializeMap.get(obj.type)?.toString(GeneratorHelper.iterate(dxfs));
      if (undefined == strings) continue;
      text.push(...strings)
    }

    text.push('0', 'ENDSEC')
    // return text;
    return [];
  }

}