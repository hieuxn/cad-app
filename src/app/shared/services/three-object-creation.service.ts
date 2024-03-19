import { Injectable } from "@angular/core";
import { ThreeObjectCreationUtils } from "../../features/utils/three-object-creation/three-object-creation.utils";

export type geometryObject = 'cylinder' | 'polyline'

@Injectable({ providedIn: 'root' })
export class ThreeObjectCreationService {
  private _creator = new ThreeObjectCreationUtils();
  cylinder = this._creator.cylinder;
}