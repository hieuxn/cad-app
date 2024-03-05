import { Injectable } from "@angular/core";
import { BufferAttribute, BufferGeometry, Line, LineBasicMaterial, Object3D, Vector3 } from "three";
import { DXFBase } from "../../../models/common.model";
import { DXFLine } from "../../../models/dxf-converter/dxf-entity.model";
import { DXFLineType } from "../../../models/dxf-converter/dxf-table.model";
import { ConverterBaseService } from "../../converter-base.service";
import { common } from "./dxf-entity-common";

@Injectable({ providedIn: 'root' })
export class DXFLineConverterService extends ConverterBaseService {


  public override toString(iterator: Generator<DXFBase, any, unknown>): string[] {
    throw new Error("Method not implemented.");
  }

  public override toDXFModel(iterator: Generator<string, any, unknown>): DXFBase[] {
    let line = new DXFLine();
    while (true) {
      let str = iterator.next().value;
      switch (str) {
        case undefined:
        case '0':
          return [line]
        case '10':
          line.start.x = +iterator.next().value
          break
        case '20':
          line.start.y = +iterator.next().value
          break
        case '30':
          line.start.z = +iterator.next().value
          break
        case '39':
          line.thickness = iterator.next().value
          break
        case '11':
          line.end.x = iterator.next().value
          break
        case '21':
          line.end.y = iterator.next().value
          break
        case '31':
          line.end.z = iterator.next().value
          break;
        default:
          Object.assign(line, common(+str, iterator.next().value))
          break
      }
    }
  }

  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    const lines: Object3D[] = [];
    for (const model of iterator) {
      const line = model as DXFLine;
      if (!line || !line.start || !line.end) return [];
      this.context.fixLength(line.start);
      this.context.fixLength(line.end);

      let lineType = 'line';
      if (line.lineTypeName) {
        let ltype: DXFLineType | undefined;
        for (const table of this.context.data.tables) {
          if (table.ltypes.has(line.lineTypeName)) {
            ltype = table.ltypes.get(line.lineTypeName);
            break;
          }
        }
        if (ltype && ltype.pattern.length > 0) lineType = 'dashed';
      }

      let material = this.materialHelper.getMaterial(this.context, line, lineType);

      const geometry = new BufferGeometry().setFromPoints([
        new Vector3(line.start.x, line.start.y, line.start.z),
        new Vector3(line.end.x, line.end.y, line.end.z),
      ]);
      geometry.setIndex(new BufferAttribute(new Uint16Array([0, 1]), 1));

      lines.push(new Line(geometry, material));
    }
    return lines;
  }

  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    const text: string[] = [];
    const line = iterator.next().value as Line;
    const positions = line.geometry.getAttribute('position');
    let i = 0;

    for (; i < positions.count - 1; i++) {
      text.push('0', 'LINE');

      text.push('10', positions.getX(i).toString());
      text.push('20', positions.getY(i).toString());
      text.push('30', positions.getZ(i).toString());

      text.push('11', positions.getX(i + 1).toString());
      text.push('21', positions.getY(i + 1).toString());
      text.push('31', positions.getZ(i + 1).toString());
    }

    const colorHex = (line.material as LineBasicMaterial).color.convertLinearToSRGB().getHex();
    const color = this.colorHelper.getNumberByColor(colorHex).toString();
    text.push('62', color);

    // return text;
    return [];
  }
}