import { Group, Object3D, Vector3 } from "three";
import { PolylineData } from "../utils/three-object-creation/creators/polyline.creator";
import { ContextMenuCommandBase, ContextMenuGenericCommand } from "./context-menu.command";
import { CommandActionBase, MousePlacementCommand } from "./mouse-placement.command";

export class DrawPolyLineCommand extends MousePlacementCommand {
  override name: string = "Draw Polyline";
  private _forceFinish: boolean = false;
  private _finishCommand!: ContextMenuCommandBase;
  private _polyline!: Group;
  private _userData!: PolylineData;
  color: number = 0x00FFFF;

  protected override onInit() {
    this._finishCommand = ContextMenuGenericCommand.create('Finish Polyline', (_) => {
      this._forceFinish = true;
      this.mouseLocations.length = this.mouseLocations.length - 1;
      this.onMouseClick(this.mouseLocations[this.mouseLocations.length - 1]);
    });
    this.contextMenuCommmands.push(this._finishCommand);

    super.onInit();
  }

  override execute(): void {
    super.execute();
    this._forceFinish = false;

    this._userData = new PolylineData([], this.color);
    this._polyline = this.objectCreatorService.polyline.create(this._userData);

    this.addToScene(this._polyline);
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);

    if (!this._forceFinish) {
      const isPolylineClosed = mouseLocations.length >= 2 && mouseLocations[mouseLocations.length - 1].distanceToSquared(mouseLocations[0]) < 1E-2;
      if (isPolylineClosed) {
        mouseLocations[mouseLocations.length - 1] = mouseLocations[0];
        this.objectCreatorService.polyline.updatePoints(this._polyline);
        this._forceFinish = true;
      }
    }

    if (this._forceFinish) {
      const polyline = this._polyline;
      this.commandService.addCommand(new CommandActionBase('Create Polyline', () => {
        this.addToScene(polyline);
      }, () => {
        this.removeFromScene(polyline);
      }));
    }


    return this._forceFinish;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    this._userData.points = mouseLocations;
    this._userData.color = this.color;
    this.objectCreatorService.polyline.updatePoints(this._polyline);
    return this._polyline;
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    this._finishCommand.isVisible = this.mouseLocations.length > 2;
    super.onMenuContextOpen(mouseEvent);
  }
}