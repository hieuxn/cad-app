import { CylinderCreator } from "./creators/cylinder.creator";

export type geometryObject = 'cylinder' | 'polyline'

export class ThreeObjectCreationUtils {
  cylinder = new CylinderCreator();
}