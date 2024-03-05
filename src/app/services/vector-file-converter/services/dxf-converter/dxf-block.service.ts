import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { GeneratorHelper } from "../../../../utils/generator.utils";
import { DXFBase } from "../../models/common.model";
import { DXFBlock } from "../../models/dxf-converter/dxf-block.model";
import { DXFEntity } from "../../models/dxf-converter/dxf-entity.model";
import { DXFEntityConverter } from "./dxf-entity.service";

@Injectable({ providedIn: 'root' })
export class DXFBlockConverter extends DXFEntityConverter {

  public override toDXFModel(iterator: Generator<string>): DXFBase[] {
    const blocks = this.context.data.blocks;

    let block!: DXFBlock;
    let type = '';
    let val = '';
    while (true) {
      let definingBlock = true;
      while (definingBlock) {
        type = iterator.next().value;
        val = iterator.next().value;
        switch (type) {
          case '0':
            if ('BLOCK' === val) blocks.push(block = new DXFBlock());
            else if ('ENDSEC' === val) return blocks;
            else definingBlock = false;
            break;
          case '1':
            block.xref = val;
            break;
          case '2':
            block.name = val;
            break;
          case '10':
            block.x = +val;
            break;
          case '20':
            block.y = +val;
            break;
          case '30':
            block.z = +val;
            break;
          case '67':
            const num = +val;
            if (num !== 0) block.paperSpace = num;
            break;
          case '410':
            block.layout = val;
            break;
        }
      }

      const entitiesString: string[] = [];
      let definingEntities = true;
      while (definingEntities) {
        if ('0' === type && 'ENDBLK' === val) {
          if (entitiesString.length > 0) {
            const entities = super.toDXFModel(GeneratorHelper.iterate(entitiesString)).filter((base: DXFBase): base is DXFEntity => base instanceof DXFEntity);
            block.entities.push(...entities);
          }
          definingEntities = false;
        }
        else if ('0' === type && 'ENDSEC' === val) return blocks;
        else {
          entitiesString.push(type);
          entitiesString.push(val);
          type = iterator.next().value;
          val = iterator.next().value;
        }
      }
    }
  }


  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    const objects: Object3D[] = [];
    for (const block of iterator) {
      if (!(block instanceof DXFBlock) || block.entities.length === 0) continue;
      const objs = super.deserialize(GeneratorHelper.iterate(block.entities));
      // objects.push(...objs);
      block.object3Ds = objs;
    }
    return objects;
  }

  public override toString(iterator: Generator<DXFBase>): string[] {
    return [];
  }

  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    return [];
  }
}