import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { DXFBase } from "../../models/common.model";
import { DXFLayout } from "../../models/dxf-converter/dxf-object.model";
import { ConverterBaseService } from "../converter-base.service";

@Injectable({ providedIn: 'root' })
export class DXFObjectConverter extends ConverterBaseService {
  public override toDXFModel(iterator: Generator<string, any, unknown>): DXFBase[] {
    const dxfFile = this.context.data;
    const objects = dxfFile.objects;

    let layout: DXFLayout | null = null;
    let foundAcDbLayout = false;
    while (!foundAcDbLayout) {
      const str = iterator.next().value
      switch (str) {
        case 'LAYOUT':
          while ('100' !== iterator.next().value);
          if ('AcDbLayout' === iterator.next().value) {
            foundAcDbLayout = true;
            objects.layouts.push(layout = new DXFLayout())
          }
          break;
        case 'ENDSEC':
          return [objects];
        default:
          break;
      }
    }
    if (!layout) throw new Error('Layout parser has flaws');

    while (true) {
      const str = iterator.next().value
      switch (str) {
        case '1':
          layout.name = iterator.next().value;
          break;
        case '5':
          layout.handle = iterator.next().value;
          break;
        case '10':
          layout.minLimitX = +iterator.next().value;
          break;
        case '20':
          layout.minLimitY = +iterator.next().value;
          break;
        case '11':
          layout.maxLimitX = +iterator.next().value;
          break;
        case '21':
          layout.maxLimitY = +iterator.next().value;
          break;
        case '12':
          layout.x = +iterator.next().value;
          break;
        case '22':
          layout.y = +iterator.next().value;
          break;
        case '32':
          layout.z = +iterator.next().value;
          break;
        case '13':
          layout.ucsX = +iterator.next().value;
          break;
        case '23':
          layout.ucsY = +iterator.next().value;
          break;
        case '33':
          layout.ucsZ = +iterator.next().value;
          break;
        case '14':
          layout.minX = +iterator.next().value;
          break;
        case '24':
          layout.minY = +iterator.next().value;
          break;
        case '34':
          layout.minZ = +iterator.next().value;
          break;
        case '15':
          layout.maxX = +iterator.next().value;
          break;
        case '25':
          layout.maxY = +iterator.next().value;
          break;
        case '35':
          layout.maxZ = +iterator.next().value;
          break;
        case '16':
          layout.ucsXaxisX = +iterator.next().value;
          break;
        case '26':
          layout.ucsXaxisY = +iterator.next().value;
          break;
        case '36':
          layout.ucsXaxisZ = +iterator.next().value;
          break;
        case '17':
          layout.ucsYaxisX = +iterator.next().value;
          break;
        case '27':
          layout.ucsYaxisY = +iterator.next().value;
          break;
        case '37':
          layout.ucsYaxisZ = +iterator.next().value;
          break;
        case '70':
          layout.flag = +iterator.next().value === 1 ? 'PSLTSCALE' : 'LIMCHECK';
          break;
        case '71':
          layout.tabOrder = iterator.next().value;
          break;
        case '76':
          layout.ucsType = +iterator.next().value;
          break;
        case '146':
          layout.evelvation = +iterator.next().value;
          break;
        case '330':
          layout.tableRecord = iterator.next().value;
          break;
        case '331':
          layout.lastActiveViewport = iterator.next().value;
          break;
        case '333':
          layout.shadePlot = iterator.next().value;
          break;
        case 'ENDSEC':
          return [objects];
        default:
          break;
      }
    }
  }

  public override toString(iterator: Generator<DXFBase>): string[] {
    throw new Error("Method not implemented.");
  }
  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    // const objects = this.context.data.objects;
    // const dxfObjects = this.toDXFModel(iterator);
    // return null;
    return [];
  }
  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    return [];
  }


}