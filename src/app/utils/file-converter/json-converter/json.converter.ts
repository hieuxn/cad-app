import { Object3D, Object3DEventMap, ObjectLoader } from "three";
import { BaseConverter } from "../base.converter";

export class JsonConverter extends BaseConverter {
  override deserialize(file: File): Promise<Object3D[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result;
          const parsed = JSON.parse(json as string);

          const loader = new ObjectLoader();
          const objects: Object3D[] = [];

          for (const obj of Object.values(parsed)) {
            const object = loader.parse(obj as any);
            objects.push(object);
          }

          resolve(objects);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  }

  override serialize(objects: Object3D<Object3DEventMap>[]): Promise<File> {
    const jsonObjects = objects.map(o => o.toJSON());
    const jsonString = JSON.stringify(jsonObjects);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], 'objects.json', { type: 'application/json' });

    return Promise.resolve(file);
  }

}