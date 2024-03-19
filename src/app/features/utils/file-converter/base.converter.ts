import { Object3D } from "three";

export abstract class BaseConverter {
  abstract deserialize(file: File): Promise<Object3D[]>;
  abstract serialize(objects: Object3D[]): Promise<File>;
  protected async readFileAsText(file: File, encoding: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve(reader.result as string);
      };

      reader.onerror = () => {
        reject(reader.error);
      };

      reader.readAsText(file, encoding);
    });
  }
}