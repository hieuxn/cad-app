import { Object3D } from "three";
import { BaseConverter } from "./base.converter";
import { DXFConverter } from "./dxf-converter/dxf.converter";
import { FBXConverter } from "./fbx-converter/fbx.converter";
import { GLBConverter, GLTFConverter } from "./gltf-converter/gltf.converter";

export class FileConverterUtils {

  private handlers = new Map<string, BaseConverter>([
    ['dxf', new DXFConverter()],
    ['gltf', new GLTFConverter()],
    ['glb', new GLBConverter()],
    ['fbx', new FBXConverter()]
  ]);

  async handleFileInput(event: Event): Promise<Object3D[]> {
    const fileList = (event.target as HTMLInputElement)?.files as FileList;
    if (!fileList) return [];
    return this.loadFile(fileList[0])
  }

  async loadFile(file: File): Promise<Object3D[]> {
    const fileExtension = (file.name || '').split('.').at(-1)?.toLowerCase() || '';
    const converter = this.handlers.get(fileExtension);
    if (!converter) return [];
    return converter.deserialize(file);
  }

  async exportToFile(objects: Object3D[], ext: string): Promise<File> {
    const converter = this.handlers.get(ext);
    if (!converter) throw new Error(`File type *.${ext} is not supported`);
    return converter.serialize(objects);
  }
}