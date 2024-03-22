import { Object3D, Object3DEventMap } from "three";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { BaseConverter } from "../base.converter";

export class FBXConverter extends BaseConverter {
  private _fbxLoader = new FBXLoader();
  override deserialize(file: File): Promise<Object3D<Object3DEventMap>[]> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      this._fbxLoader.load(url, (object) => {
        URL.revokeObjectURL(url);
        resolve([object]);
      }, undefined, reject);
    });
  }
  
  override serialize(objects: Object3D<Object3DEventMap>[]): Promise<File> {
    throw new Error("Method not implemented.");
  }

}