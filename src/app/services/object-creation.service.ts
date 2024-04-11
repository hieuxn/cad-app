import { Injectable } from "@angular/core";
import { Group } from "three";
import { CylinderData } from "../utils/three-object-creation/creators/cylinder.creator";
import { HBeamData } from "../utils/three-object-creation/creators/h-beam.creator";
import { PolylineData } from "../utils/three-object-creation/creators/polyline.creator";
import { ThreeObjectCreationUtils } from "../utils/three-object-creation/three-object-creation.utils";

export type geometryObject = 'cylinder' | 'polyline'

@Injectable({ providedIn: 'root' })
export class ObjectCreationService {
  private _creator = new ThreeObjectCreationUtils();
  cylinder = this._creator.cylinder;
  hBeam = this._creator.hBeam;
  polyline = this._creator.polyline;

  reCreate(group: Group): Group {
    return this.reCreateByName(group.name, group.userData);
  }

  reCreateByName(name: string, userData: Record<string, any>) {
    switch (name) {
      case this.cylinder.name:
        return this.cylinder.create(userData as CylinderData);
      case this.hBeam.name:
        return this.hBeam.create(userData as HBeamData);
      case this.polyline.name:
        return this.polyline.create(userData as PolylineData);
      default:
        throw new Error('No creator for this kind of group: ' + name);
    }
  }
}