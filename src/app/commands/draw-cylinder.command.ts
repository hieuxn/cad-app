import { Group, Object3D, Vector3 } from "three";
import { CylinderData } from "../utils/three-object-creation/creators/cylinder.creator";
import { CommandActionBase, MousePlacementCommand } from "./mouse-placement.command";

export class DrawCylinderCommand extends MousePlacementCommand {

  override name: string = "Pile";
  color: number = 0xB5B5B5;
  private _defaultRadius = 0.1; //m
  private _defaultDepth = 1; //m
  private _defaultRadialSegments = 32;
  private _pile!: Group;
  private _userData!: CylinderData;

  override execute(): any {
    super.execute();
    this._userData = new CylinderData(this._defaultDepth, this._defaultRadius, this._defaultRadialSegments, this.color);
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    const click2Times = mouseLocations.length >= 2;

    if (click2Times) {
      this.removeFromScene(this._pile)
      this._pile = this.objectCreatorService.cylinder.create(this._userData);;
      this._translate(mouseLocations);
      this.addToScene(this._pile);

      const pile = this._pile;
      this.commandService.addCommand(new CommandActionBase("Create Pile", () => {
        this.addToScene(pile);
      }, () => {
        this.removeFromScene(pile);
      }))
    }
    return click2Times;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    if (mouseLocations.length === 1) return this._pile = this.objectCreatorService.cylinder.create(this._userData);

    if (mouseLocations.length === 2) this._defaultRadius = mouseLocations[0].distanceTo(mouseLocations[1]);

    this._userData.depth = this._defaultDepth;
    this._userData.radius = this._defaultRadius;
    this._userData.radialSegments = this._defaultRadialSegments;
    this._userData.color = this.color;
    this.objectCreatorService.cylinder.temporarilyScale(this._pile);
    this._translate(mouseLocations);

    if (!this._pile.parent) this.addToScene(this._pile);
    return this._pile;
  }

  private _translate(mouseLocations: Vector3[]) {
    this._pile.position.copy(mouseLocations.at(0)!);
  }
}