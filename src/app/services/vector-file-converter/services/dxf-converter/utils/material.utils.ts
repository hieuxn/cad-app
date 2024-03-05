import { Injectable } from "@angular/core";
import { DoubleSide, LineBasicMaterial, LineDashedMaterial, Material, MeshBasicMaterial } from "three";
import { DXFContext } from "../../../models/dxf-converter/dxf-context.model";
import { DXFEntity } from "../../../models/dxf-converter/dxf-entity.model";
import { ColorConverter } from "./color.utils";

@Injectable({ providedIn: 'root' })
export class MaterialHelper {
  private materialCache = new Map<string, Material>();

  constructor(private colorHelper: ColorConverter) { }

  public getMaterial(context: DXFContext, entity: DXFEntity, ltype: string,): Material {
    let color = this.getColorHex(context, entity);
    let key = entity.lineTypeName + ltype + color;
    const material = this.materialCache.get(key);
    if (material) return material;

    const mat = ltype === 'shape' ? new MeshBasicMaterial({ side: DoubleSide }) :
      (ltype === 'line' ? new LineBasicMaterial() : this.createDashedMaterial(context, entity));

    mat.color.setHex(color);
    mat.color.convertSRGBToLinear();
    mat.name = key;
    this.materialCache.set(key, mat);

    return mat;
  }

  private createDashedMaterial(context: DXFContext, entity: DXFEntity) {
    let gapSize = 4;
    let dashSize = 4;

    let ltype;
    for (const table of context.data.tables) {
      if (table.ltypes.has(entity.lineTypeName)) {
        ltype = table.ltypes.get(entity.lineTypeName);
        break;
      }
    }

    if (ltype) {
      dashSize = ltype.pattern && ltype.pattern.length > 0 ? Math.max(...ltype.pattern.map(e => e.length)) : 4;
      gapSize = ltype.pattern && ltype.pattern.length > 0 ? ltype.pattern.map(e => e.length === -1).length : 4;
    }

    dashSize = dashSize === 0 ? 4 : dashSize;

    return new LineDashedMaterial({ gapSize: gapSize, dashSize: dashSize });
  }

  private getColorHex(context: DXFContext, entity: DXFEntity): number {
    let colorNumber = entity.fillColor ? entity.fillColor : entity.colorNumber;
    if (!colorNumber || colorNumber === 0) {
      if (entity.layer) {
        for (const table of context.data.tables) {
          if (table.layers.has(entity.layer)) {
            colorNumber = table.layers.get(entity.layer)?.colorNumber || -1;
            break;
          }
        }
      }
    }

    return this.colorHelper.getColorByNumber(colorNumber);
  }
}