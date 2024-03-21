import { EntityCommons } from "@dxfjs/parser";
import { DoubleSide, LineBasicMaterial, LineDashedMaterial, Material, MeshBasicMaterial } from "three";
import { DxfParserContext } from "../models/dxf-context.model";
import { ColorUtils } from "./color.utils";

export class MaterialUtils {
  private materialCache = new Map<string, Material>();

  constructor(private colorUtils: ColorUtils) { }

  getColorNumber(material: Material | Material[]): number {
    if (material instanceof LineBasicMaterial || material instanceof LineDashedMaterial) {
      const hexColor = material.color.getHex();
      return this.colorUtils.getNumberByColor(hexColor);
    }
    return 255;
  }

  getMaterial(context: DxfParserContext, entity: EntityCommons, ltype: string): Material {
    let color = this.getColorHex(context, entity);
    let key = entity.linetypeName + ltype + color;
    const material = this.materialCache.get(key);
    if (material) return material;

    const mat = ltype === 'shape' ? new MeshBasicMaterial({ side: DoubleSide }) :
      (ltype === 'line' ? new LineBasicMaterial() : this.createDashedMaterial(context, entity));
    console.log(ltype);

    mat.color.setHex(color);
    mat.name = key;
    this.materialCache.set(key, mat);

    return mat;
  }

  private createDashedMaterial(context: DxfParserContext, entity: EntityCommons) {
    let gapSize = 0.004;
    let dashSize = 0.004;

    let linetype;
    for (const ltype of context.dxfObject.tables.lType.records) {
      if (ltype.name === entity.linetypeName) {
        linetype = ltype;
        break;
      }
    }

    if (linetype) {
      const patternLength = (linetype.patternLength || 0);
      const pattern = linetype.elements || [];
      dashSize = pattern && patternLength > 0 ? context.fixLength(Math.max(...pattern.map(e => e.length))) : 0.004;
      gapSize = pattern && patternLength > 0 ? context.fixLength(pattern.map(e => e.length === -1).length) : 0.004;
    }
    else return new LineBasicMaterial();

    return new LineDashedMaterial({ gapSize: gapSize, dashSize: dashSize });
  }

  private getColorHex(context: DxfParserContext, entity: EntityCommons): number {
    let colorNumber = entity.colorNumber;
    if (!colorNumber || colorNumber === 0) {
      if (entity.layerName) {
        for (const layer of context.dxfObject.tables.layer.records) {
          if (entity.layerName === layer.name) {
            colorNumber = layer.color;
            break;
          }
        }
      }
    }

    return this.colorUtils.getColorByNumber(colorNumber || -1);
  }
}