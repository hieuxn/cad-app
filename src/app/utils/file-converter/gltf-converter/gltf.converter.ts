
import { Object3D } from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BaseConverter } from '../base.converter';

export class GLTFConverter extends BaseConverter {
  constructor() {
    super();
  }

  override async deserialize(file: File): Promise<Object3D[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const loader = new GLTFLoader();
        const contents = event.target?.result as string;
        loader.parse(contents, '', (gltf) => {
          resolve(gltf.scene.children);
        }, reject);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  override async serialize(objects: Object3D[]): Promise<File> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(objects, (gltf) => {
        try {
          const blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
          const file = new File([blob], 'model.gltf', { type: 'model/gltf+json' });
          resolve(file);
        } catch (error) {
          reject(new Error('Failed to serialize objects to GLTF format.'));
        }
      },
        reject, { binary: false });
    });
  }
}


export class GLBConverter extends BaseConverter {
  constructor() {
    super();
  }

  override async deserialize(file: File): Promise<Object3D[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const contents = event.target?.result as ArrayBuffer;
        const loader = new GLTFLoader();
        loader.parse(contents, '', (gltf) => {
          resolve(gltf.scene.children);
        }, reject);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  override async serialize(objects: Object3D[]): Promise<File> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(objects, (gltf) => {
        try {
          if (!(gltf instanceof ArrayBuffer)) {
            reject('Failed to serialize objects to GLB format');
            return;
          }
          const blob = new Blob([gltf], { type: 'model/gltf-binary' });
          const file = new File([blob], 'scene.glb', { type: 'model/gltf-binary' });
          resolve(file);
        } catch (error) {
          reject(error);
        }
      }, reject, { binary: true });
    });
  }
}
