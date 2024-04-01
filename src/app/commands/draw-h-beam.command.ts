import { Injector } from "@angular/core";
import { Group, Object3D, Quaternion, Vector3 } from "three";
import { AngleSnappingUtils } from "../utils/angle-snapping.utils";
import { LengthAngleIndicatorUtils } from "../utils/dimension-indicator.utils";
import { HBeamData } from "../utils/three-object-creation/creators/h-beam.creator";
import { CommandActionBase, MousePlacementCommand } from "./mouse-placement.command";

export class DrawHBeamCommand extends MousePlacementCommand {
  private _b: number = 1;
  private _d: number = 1;
  private _t: number = 0.1;
  private _s: number = 0.3;
  private _xVector = new Vector3(1, 0, 0);
  private _hBeam!: Group;
  private _userData!: HBeamData
  private _angleSnapping = new AngleSnappingUtils();
  private _indicator: LengthAngleIndicatorUtils;
  override name: string = "H Beam";
  color: number = 0xB2B2B2;

  constructor(injector: Injector) {
    super(injector);
    this._indicator = new LengthAngleIndicatorUtils(injector);
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const isFinished = mouseLocations.length > 1;

    if (isFinished) {
      this.removeFromScene(this._hBeam);
      this._hBeam = this.objectCreatorService.hBeam.create(this._userData);
      this._translateAndRotate(mouseLocations);
      this.addToScene(this._hBeam);

      const hBeam = this._hBeam;
      this.commandService.addCommand(new CommandActionBase("Create H Beam", () => {
        this.addToScene(hBeam);
      }, () => {
        this.removeFromScene(hBeam);
      }))

    }
    else {
      if (mouseLocations.length > 0) {
        const dimensions = this._indicator.cancel();
        this._indicator.init(mouseLocations.at(-1)!);

        dimensions.forEach(dimension => {
          if (!dimension.parent) this.addToScene(dimension);
        })
      }
    }

    return isFinished;
  }

  override cancel(): void {
    super.cancel();
    const dimensions = this._indicator.cancel();
    dimensions.forEach(dimension => this.removeFromScene(dimension));
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    if (mouseLocations.length === 1) return this._hBeam = this._createHBeam();

    const length = this._calculateLength(mouseLocations);

    this._userData.length = length;
    this._userData.breadth = this._b;
    this._userData.depth = this._d;
    this._userData.thickness = this._t;
    this._userData.space = this._s;
    this._userData.color = this.color;

    this.objectCreatorService.hBeam.temporarilyScale(this._hBeam);
    this._translateAndRotate(mouseLocations);

    if (!this._hBeam.parent) this.addToScene(this._hBeam);

    if (mouseLocations.length > 1) {
      this._indicator.onMousePositionUpdate(mouseLocations.at(-2)!, mouseLocations.at(-1)!);
    }

    return this._hBeam;
  }

  private _createHBeam(): Group {
    const length = 1;
    this._userData = new HBeamData(length, this._b, this._d, this._t, this._s, this.color);
    const group = this.objectCreatorService.hBeam.create(this._userData);
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

  override onMouseMove(mouseLocation: Vector3): void {
    if (this.mouseLocations.length > 1) this._angleSnapping.snapPoint(this.mouseLocations.at(-2)!, mouseLocation);
    super.onMouseMove(mouseLocation);
  }

  override onMouseClick(mouseLocation: Vector3): void {
    if (this.mouseLocations.length > 1) this._angleSnapping.snapPoint(this.mouseLocations.at(-2)!, mouseLocation);
    super.onMouseClick(mouseLocation);
  }

}