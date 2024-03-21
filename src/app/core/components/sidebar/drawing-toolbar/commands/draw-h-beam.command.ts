import { Object3D, Vector3 } from "three";
import { MousePlacementCommand } from "../../../../../shared/commands/mouse-placement.command";

export class DrawHBeamCommand extends MousePlacementCommand {
  private _b: number = 1;
  private _d: number = 1;
  private _t: number = 0.1;
  private _s: number = 0.3;
  private _xVector = new Vector3(1, 0, 0);
  override name: string = "Draw H Beam";
  color: number = 0xB2B2B2;
  userData: Record<string, string> = {};

  override execute(): void {
    super.execute();
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    return mouseLocations.length > 1;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D[] | null {
    let length = 0;
    let pos = mouseLocations.length > 0 ? mouseLocations[0] : new Vector3();
    let placementVector = mouseLocations.length > 0 ? mouseLocations[0] : new Vector3();
    if (mouseLocations.length >= 2) {
      length = mouseLocations[0].distanceTo(mouseLocations[1]);
      placementVector = (mouseLocations[1].clone().sub(mouseLocations[0]));
    }

    const group = this.objectCreatorService.hBeam.create(length, this._b, this._d, this._t, this._s, this.color);
    // group.name = this.userData['blockName'] as string;

    group.position.copy(pos.clone().add(placementVector.clone().divideScalar(2)));

    const sign = Math.sign(this._xVector.clone().cross(placementVector).z);
    const angle = placementVector.angleTo(this._xVector) * sign;
    group.rotateZ(angle)

    return [group];
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    super.onMenuContextOpen(mouseEvent);
  }
}