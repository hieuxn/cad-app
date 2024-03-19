import { Injectable } from "@angular/core";
import { Object3D } from "three";
import { FileConverterUtils } from "../../features/utils/file-converter/file-converter.utils";

@Injectable({ providedIn: 'root' })
export class FileConveterService {
  private _fileConverterModule = new FileConverterUtils();

  async handleFileInput(event: Event): Promise<Object3D[]> {
    return this._fileConverterModule.handleFileInput(event);
  }

  async loadFile(file: File): Promise<Object3D[]> {
    return this._fileConverterModule.loadFile(file);
  }

  async exportToFile(objects: Object3D[], ext: string): Promise<File> {
    return this._fileConverterModule.exportToFile(objects, ext);
  }
}