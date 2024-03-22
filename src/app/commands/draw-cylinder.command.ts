import { Group, Object3D, Vector3 } from "three";
import { MousePlacementCommand } from "./mouse-placement.command";

export class DrawCylinderCommand extends MousePlacementCommand {
  override name: string = "Cylinder";
  color: number = 0xB5B5B5;
  userData: Record<string, string | number> = { 'height': 1 };
  private _defaultRadius = 0.1; //m
  private _defaultDepth = 1; //m
  private _defaultRadialSegments = 32;
  private _pile!: Group;

  protected override onInit() {
    super.onInit();
  }

  override execute(): void {
    super.execute();
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const click2Times = mouseLocations.length >= 2;

    if (click2Times) {
      const { depth, radius, radialSegments, color } = this._pile.userData;
      this.removeFromScene(this._pile)
      this._pile = this.objectCreatorService.cylinder.create(depth, radius, radialSegments, color);;
      this._translate(mouseLocations);
      this.addToScene(this._pile);
    }
    return click2Times;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    if (mouseLocations.length === 1) return this._pile = this.objectCreatorService.cylinder.create(this._defaultDepth, this._defaultRadius, this._defaultRadialSegments, this.color);

    if (mouseLocations.length === 2) this._defaultRadius = mouseLocations[0].distanceTo(mouseLocations[1]);

    this._pile.userData = { depth: this._defaultDepth, radius: this._defaultRadius, radialSegments: 32, color: this.color };
    this.objectCreatorService.cylinder.temporarilyScale(this._pile);
    this._translate(mouseLocations);

    if (!this._pile.parent) this.addToScene(this._pile);
    return this._pile;
  }

  private _translate(mouseLocations: Vector3[]) {
    this._pile.position.copy(mouseLocations.at(0)!);
  }
}