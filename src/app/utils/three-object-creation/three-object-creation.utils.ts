import { CylinderCreator } from "./creators/cylinder.creator";
import { HBeamCreator } from "./creators/h-beam.creator";
import { PolylineCreator } from "./creators/polyline.creator";

export type geometryObject = 'cylinder' | 'polyline'

export class ThreeObjectCreationUtils {
  cylinder = new CylinderCreator();
  hBeam = new HBeamCreator();
  polyline = new PolylineCreator();
}