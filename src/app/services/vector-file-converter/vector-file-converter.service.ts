import { Injectable, inject } from "@angular/core";
import { Object3D } from "three";
import { DXFConverterService } from "./services/dxf-converter/dxf-converter.service";
import { FileConverterBase } from "./services/file-converter-base.service";

@Injectable({ providedIn: 'root' })
export class VectorFileConveterService {

  private handlers = new Map<string, FileConverterBase>([
    ['dxf', inject(DXFConverterService)]
  ]);

  public async handleFileInput(event: Event): Promise<Object3D[] | null> {
    const fileList = (event.target as HTMLInputElement)?.files as FileList;
    if (!fileList) return null;
    return this.loadFile(fileList[0])
  }

  private async loadFile(file: File): Promise<Object3D[]> {
    const fileExtension = file.name.split('.').at(-1)?.toLowerCase() || '';
    const converter = this.handlers.get(fileExtension);
    if (!converter) throw new Error(`File type *.${file.type} is not supported`);
    return converter.deserialize(file);
  }

  public async exportToFile(objects: Object3D[], ext: string): Promise<File> {
    const converter = this.handlers.get(ext);
    if (!converter) throw new Error(`File type *.${ext} is not supported`);
    return converter.serialize(objects);
  }
}