import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { LengthService } from "../../length.service";
import { DXFBase } from "../models/common.model";
import { DXFContext } from "../models/dxf-converter/dxf-context.model";
import { DXFFile } from "../models/dxf-converter/dxf-file.model";
import { DXFContextService } from "./dxf-converter/dxf-context.service";
import { ColorConverter } from "./dxf-converter/utils/color.utils";
import { MaterialHelper } from "./dxf-converter/utils/material.utils";

@Injectable({ providedIn: 'root' })
export abstract class ConverterBaseService {
  protected get context(): DXFContext {
    return this.contextService.getCurrentContext();
  }

  protected createContext(file: DXFFile) {
    this.contextService.createNewContext();
    this.context.init(file);
  }

  constructor(protected materialHelper: MaterialHelper,
    protected lengthService: LengthService,
    protected colorHelper: ColorConverter,
    private contextService: DXFContextService) {
  }

  // protected isHidden(entity: TIn): boolean {
  //   if (typeof entity.visible !== 'undefined' && !entity.visible) return true;

  //   // if (typeof entity.paperSpace !== 'undefined' && Properties.showFrozen !== entity.paperSpace) return true;

  //   // if (entity.lineTypeName === 'HIDDEN') return true;
  //   // let layer = Object.prototype.hasOwnProperty.call(this.data.tables.layers, entity.layer) ? this.data.tables.layers[entity.layer] : null;
  //   // if (layer) {

  //   //   if (!layer.visible) return true;

  //   //   if (!Properties.showFrozen && layer.flags.includes('frozen')) return true;
  //   //   if (!Properties.showLocked && layer.flags.includes('locked')) return true;
  //   // }
  //   return false;
  // }
  public abstract toDXFModel(iterator: Generator<string>): DXFBase[];
  public abstract toString(iterator: Generator<DXFBase>): string[];
  public abstract deserialize(iterator: Generator<DXFBase>): Object3D[];
  public abstract serialize(iterator: Generator<Object3D>): DXFBase[];
}