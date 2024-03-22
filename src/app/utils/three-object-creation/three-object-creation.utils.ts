import { CylinderCreator } from "./creators/cylinder.creator";
import { HBeamCreator } from "./creators/h-beam.creator";

export type geometryObject = 'cylinder' | 'polyline'

export class ThreeObjectCreationUtils {
  cylinder = new CylinderCreator();
  hBeam = new HBeamCreator();

}