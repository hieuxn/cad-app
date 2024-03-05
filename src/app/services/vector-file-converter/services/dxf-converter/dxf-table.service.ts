import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { GeneratorHelper } from "../../../../utils/generator.utils";
import { DXFBase } from "../../models/common.model";
import { DXFLayer, DXFLinePattern, DXFLineType, DXFStyle, DXFTable, DXFViewport } from "../../models/dxf-converter/dxf-table.model";
import { ConverterBaseService } from "../converter-base.service";

@Injectable({ providedIn: 'root' })
export class DXFTableConverter extends ConverterBaseService {

  private deserializeMap: Map<string, (param: Generator<string>) => DXFBase> = new Map<string, (param: Generator<string>) => DXFBase>([
    ['LAYER', this.deserializeToLayer.bind(this)],
    ['LTYPE', this.deserializeToLineType.bind(this)],
    ['VPORT', this.deserializeToViewport.bind(this)],
    ['STYLE', this.deserializeToStyle.bind(this)],
  ]);

  private deserializeToLayer(iterator: Generator<string>): DXFLayer {
    const layer = new DXFLayer();
    while (true) {
      switch (iterator.next().value) {
        case '2':
          layer.name = iterator.next().value;
          break;
        case '6':
          layer.lineTypeName = iterator.next().value;
          break;
        case '62':
          layer.colorNumber = +iterator.next().value;
          break;
        case '70':
          layer.flags = +iterator.next().value;
          break;
        case '290':
          layer.plot = +iterator.next().value !== 0;
          break;
        case '370':
          layer.lineWeightEnum = iterator.next().value;
          break;
        case '0':
          this.context.data.tables.at(-1)!.layers.set(layer.name, layer);
          return layer;
      }
    }
  }

  private deserializeToLineType(iterator: Generator<string>): DXFLineType {
    const lineType = new DXFLineType();
    let pattern!: DXFLinePattern;
    while (true) {
      switch (iterator.next().value) {
        case '2':
          lineType.name = iterator.next().value;
          break;
        case '3':
          lineType.description = iterator.next().value;
          break;
        case '70':
          lineType.flag = +iterator.next().value;
          break;
        case '72':
          lineType.alignment = +iterator.next().value;
          break;
        case '73':
          lineType.elementCount = +iterator.next().value;
          break;
        case '40':
          lineType.patternLength = +iterator.next().value;
          break;
        case '49':
          pattern = new DXFLinePattern();
          pattern.length = +iterator.next().value;
          lineType.pattern.push(pattern);
          break;
        case '9':
          pattern.text = iterator.next().value;
          break;
        case '44':
          pattern.offset.x = +iterator.next().value;
          break;
        case '45':
          pattern.offset.y = +iterator.next().value;
          break;
        case '46':
          pattern.scales.push(+iterator.next().value);
          break;
        case '74':
          pattern.shape = +iterator.next().value;
          break;
        case '75':
          pattern.shapeNumber = +iterator.next().value;
          break;
        case '50':
          pattern.rotation = +iterator.next().value;
          break;
        case '340':
          pattern.styleHandle = iterator.next().value;
          break;
        case '0':
          this.context.data.tables.at(-1)!.ltypes.set(lineType.name, lineType);
          return lineType;
      }
    }
  }

  private deserializeToViewport(iterator: Generator<string>): DXFViewport {
    const viewport = new DXFViewport();
    this.context.data.tables.at(-1)!.vports.set(viewport.name, viewport);
    return viewport;
  }

  private deserializeToStyle(iterator: Generator<string>): DXFStyle {
    const style = new DXFStyle();
    this.context.data.tables.at(-1)!.styles.set(style.name, style);
    return style;
  }

  public override toDXFModel(iterator: Generator<string>): DXFBase[] {
    while (true) {
      let str = iterator.next().value;
      if (undefined === str || 'ENDSEC' === str) return this.context.data.tables;
      if ('TABLE' === str) this.context.data.tables.push(new DXFTable());
      const method = this.deserializeMap.get(str);
      if (undefined === method) continue;
      method(iterator);
    }
  }

  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    // const dxfObjects = this.toDXFModel(iterator);
    // return null;
    return [];
  }

  public override toString(iterator: Generator<DXFBase>): string[] {
    const text: string[] = [];

    text.push('0', 'TABLE');

    for (const model of iterator) {
      const table = model as DXFTable;
      for (const [_, layer] of table.layers) {
        text.push('2', 'LAYER');
        text.push('2', layer.name);
        text.push('6', layer.lineTypeName);
        text.push('62', layer.colorNumber.toString());
        text.push('70', layer.flags.toString());
        text.push('290', layer.plot.toString());
        text.push('370', layer.lineWeightEnum.toString());
      }

      for (const [_, lineType] of table.ltypes) {
        text.push('2', 'LTYPE');
        text.push('2', lineType.name);
        text.push('3', lineType.description);
        text.push('70', lineType.flag.toString());
        text.push('72', lineType.alignment.toString());
        text.push('73', lineType.elementCount.toString());
        text.push('40', lineType.patternLength.toString());
        for (const pattern of lineType.pattern) {
          text.push('49', pattern.length.toString());
          text.push('9', pattern.text);
          text.push('44', pattern.offset.x.toString());
          text.push('45', pattern.offset.y.toString());
          if (pattern.scales.length > 0) text.push('46', pattern.scales[0].toString());
          text.push('74', pattern.shape.toString());
          text.push('75', pattern.shapeNumber.toString());
          text.push('50', pattern.rotation.toString());
          text.push('340', pattern.styleHandle);
        }
      }
    }
    text.push('0', 'ENDTAB');

    return text;
  }

  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    const text: string[] = [];
    const tables = this.context.data.tables;

    text.push('0', 'SECTION');
    text.push('2', 'TABLES');

    const str = this.toString(GeneratorHelper.iterate(tables));
    text.push(...str);

    text.push('0', 'ENDSEC');

    // return text;
    return [];
  }
}