import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { GeneratorHelper } from "../../../../utils/generator.utils";
import { DXFBase } from "../../models/common.model";
import { DXFFile } from "../../models/dxf-converter/dxf-file.model";
import { ConverterBaseService } from "../converter-base.service";

@Injectable({ providedIn: 'root' })
export class DXFHeaderConverter extends ConverterBaseService {
  public override toDXFModel(iterator: Generator<string>): DXFBase[] {
    const dxfFile = new DXFFile();
    const header = dxfFile.header;
    this.createContext(dxfFile);

    while (true) {
      const str = iterator.next().value
      switch (str) {
        case '$MEASUREMENT':
          switch (iterator.next().value) {
            case '70':
              header.measurement = +(iterator.next().value);
              break;
          }
          break
        case '$INSUNITS':
          switch (iterator.next().value) {
            case '70':
              header.insUnits = +(iterator.next().value);
              break;
          }
          break
        case '$EXTMIN':
        case '$EXTMAX':
          const ext = str === '$EXTMIN' ? header.extMin : header.extMax;
          let cont = true;
          while (cont) {
            switch (iterator.next().value) {
              case '10':
                ext.x = +(iterator.next().value)
                break
              case '20':
                ext.y = +(iterator.next().value)
                break
              case '30':
                ext.z = +(iterator.next().value)
                cont = false;
                break
            }
          }
          break
        case '$DIMASZ':
          switch (iterator.next().value) {
            case '40':
              header.dimArrowSize = +(iterator.next().value);
              break;
          }
          break
        case 'ENDSEC':
          return [header];
      }
    }
  }

  public override deserialize(iterator: Generator<DXFBase>): Object3D[] {
    return []
  }

  public override toString(iterator: Generator<DXFBase>): string[] {
    const header = iterator.next().value;
    const text: string[] = []
    text.push('0', 'SECTION');
    text.push('2', 'HEADER');
    text.push('9', '$DIMASZ', '40', header.dimArrowSize.toString());
    text.push('9', '$INSUNITS', '70', header.insUnits.toString());
    text.push('9', '$MEASUREMENT', '70', header.measurement.toString());
    text.push('9', '$EXTMIN', '10', header.extMin.x.toString(), '20', header.extMin.y.toString(), '30', header.extMin.z.toString());
    text.push('9', '$EXTMAX', '10', header.extMax.x.toString(), '20', header.extMax.y.toString(), '30', header.extMax.z.toString());
    text.push('0', 'ENDSEC');
    return text;
  }

  public override serialize(iterator: Generator<Object3D>): DXFBase[] {
    const dxfFile = new DXFFile();
    this.createContext(dxfFile);

    const text = this.toString(GeneratorHelper.convert(this.context.data.header));
    // return text;
    return [];
  }

}