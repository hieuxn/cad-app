import { Injectable } from "@angular/core";
import { Group } from "three";
import { ThreeObjectCreationUtils } from "../utils/three-object-creation/three-object-creation.utils";
import { ThreeUtils } from "../utils/three.utils";

export type geometryObject = 'cylinder' | 'polyline'

@Injectable({ providedIn: 'root' })
export class ThreeObjectCreationService {
  private _creator = new ThreeObjectCreationUtils();
  private _threeUtils = new ThreeUtils();
  cylinder = this._creator.cylinder;
  hBeam = this._creator.hBeam;

  update(group: Group) {
    switch (group.name) {
      case this.cylinder.name:
        this.cylinder.temporarilyScale(group);
        break;
      case this.hBeam.name:
        this.hBeam.temporarilyScale(group);
        break;
    }
  }
}