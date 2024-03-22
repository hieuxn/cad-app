import { Group, Object3D, Quaternion, Vector3 } from "three";
import { MousePlacementCommand } from "./mouse-placement.command";

export class DrawHBeamCommand extends MousePlacementCommand {
  private _b: number = 1;
  private _d: number = 1;
  private _t: number = 0.1;
  private _s: number = 0.3;
  private _xVector = new Vector3(1, 0, 0);
  private _hBeam!: Group;
  override name: string = "H Beam";
  color: number = 0xB2B2B2;
  userData: Record<string, string> = {};

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const isFinished = mouseLocations.length > 1;

    if (isFinished) {
      const { length, depth, breadth, thickness, space, color } = this._hBeam.userData;
      this.removeFromScene(this._hBeam);
      this._hBeam = this.objectCreatorService.hBeam.create(length, breadth, depth, thickness, space, color);
      this._translateAndRotate(mouseLocations);
      this.addToScene(this._hBeam);
    }

    return isFinished;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    if (mouseLocations.length === 1) return this._hBeam = this._createHBeam();

    const length = this._calculateLength(mouseLocations);
    this._hBeam.userData = { length: length, depth: this._d, breadth: this._b, thickness: this._t, space: this._s, color: this.color };
    this.objectCreatorService.hBeam.temporarilyScale(this._hBeam);
    this._translateAndRotate(mouseLocations);

    if (!this._hBeam.parent) this.addToScene(this._hBeam);

    return this._hBeam;
  }

  private _createHBeam(): Group {
    const length = 1;
    const group = this.objectCreatorService.hBeam.create(length, this._b, this._d, this._t, this._s, this.color);
    return group;
  }

  private _translateAndRotate(mouseLocations: Vector3[]) {
    let pos = mouseLocations.length > 0 ? mouseLocations[0] : new Vector3();
    let placementVector = mouseLocations.length > 0 ? mouseLocations[0] : new Vector3();

    if (mouseLocations.length >= 2) {
      length = this._calculateLength(mouseLocations);
      placementVector = (mouseLocations[1].clone().sub(mouseLocations[0]));
    }

    this._hBeam.position.copy(pos.clone().add(placementVector.clone().divideScalar(2)));

    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), placementVector.normalize());
    this._hBeam.quaternion.copy(quaternion);
  }

  private _calculateLength(mouseLocations: Vector3[]) {
    return length = mouseLocations[0].distanceTo(mouseLocations[1]);
  }


}