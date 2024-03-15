import { Injectable } from "@angular/core";
import { CylinderCreator } from "./creators/cylinder.creator";

export type geometryObject = 'cylinder' | 'polyline'

@Injectable({ providedIn: 'root' })
export class ObjectCreatorService {
  cylinder = new CylinderCreator();
}