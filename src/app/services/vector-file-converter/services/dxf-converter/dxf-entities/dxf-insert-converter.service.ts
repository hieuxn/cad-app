import { Injectable } from "@angular/core";
import { Group, Object3D } from "three";
import { DXFBase } from "../../../models/common.model";
import { DXFInsert } from "../../../models/dxf-converter/dxf-entity.model";
import { ConverterBaseService } from "../../converter-base.service";
import { common } from "./dxf-entity-common";

@Injectable({ providedIn: 'root' })
export class DXFInsertConverterService extends ConverterBaseService {

  // private entityConverter: DXFEntityConverter = inject(DXFEntityConverter);
  public override toString(iterator: Generator<DXFBase, any, unknown>): string[] {
    throw new Error("Method not implemented.");
  }
  private fixNum(num: number): number {
    const ret = this.context.fixLength(num)
    return ret as number;
  }

  public override toDXFModel(iterator: Generator<string, any, unknown>): DXFBase[] {
    let insert = new DXFInsert();

    while (true) {
      let str = iterator.next().value;
      switch (str) {
        case '0':
          return [insert];
        case '2':
          insert.block = iterator.next().value;
          break;
        case '10':
          insert.x = this.fixNum(+iterator.next().value);
          break;
        case '20':
          insert.y = this.fixNum(+iterator.next().value);
          break;
        case '30':
          insert.z = this.fixNum(+iterator.next().value);
          break;
        case '41':
          insert.scaleX = +iterator.next().value;
          break;
        case '42':
          insert.scaleY = +iterator.next().value;
          break;
        case '43':
          insert.scaleZ = +iterator.next().value;
          break;
        case '44':
          insert.columnSpacing = +iterator.next().value;
          break;
        case '45':
          insert.rowSpacing = +iterator.next().value;
          break;
        case '50':
          insert.rotation = +iterator.next().value;
          break;
        case '70':
          insert.columnCount = +iterator.next().value;
          break;
        case '71':
          insert.rowCount = +iterator.next().value;
          break;
        case '210':
          insert.extrusionX = +iterator.next().value;
          break;
        case '220':
          insert.extrusionY = +iterator.next().value;
          break;
        case '230':
          insert.extrusionZ = +iterator.next().value;
          break;
        default:
          Object.assign(insert, common(+str, iterator.next().value));
          break;
      }
    }
  }

  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    const inserts: Object3D[] = [];
    for (const insert of iterator) {
      if (!(insert instanceof DXFInsert)) continue;
      const block = this.context.data.blocks.find(block => block.name === insert.block)
      if (undefined === block) continue;
      const extrusionZ = insert.extrusionZ < 0 ? -1 : 1;
      const group = new Group();
      group.scale.set(insert.scaleX, insert.scaleY, insert.scaleZ);
      group.rotation.z = extrusionZ * (insert.rotation * Math.PI / 180);
      group.position.set(extrusionZ * insert.x, insert.y, insert.z);
      group.add(...block.object3Ds.map(obj => obj.clone()));
      inserts.push(group);
    }
    return inserts;
  }

  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    return [];
  }
}