import { Injector } from "@angular/core";
import { Group, Object3D, Vector3 } from "three";
import { AngleSnappingUtils } from "../utils/angle-snapping.utils";
import { LengthAngleIndicatorUtils } from "../utils/dimension-indicator.utils";
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
  private _indicator: LengthAngleIndicatorUtils;
  private _angleSnapping = new AngleSnappingUtils();

  constructor(injector: Injector) {
    super(injector);
    this._indicator = new LengthAngleIndicatorUtils(injector);
  }

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


    if (false === this._forceFinish) {
      if (mouseLocations.length > 0) {
        const dimensions = this._indicator.cancel();
        this._indicator.init(mouseLocations.at(-1)!);

        dimensions.forEach(dimension => {
          if (!dimension.parent) this.addToScene(dimension);
        })
      }
    }

    return this._forceFinish;
  }

  override cancel(): void {
    const dimensions = this._indicator.cancel();
    dimensions.forEach(dimension => this.removeFromScene(dimension));

    super.cancel();
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    this._userData.points = mouseLocations;
    this._userData.color = this.color;
    this.objectCreatorService.polyline.updatePoints(this._polyline);

    if (mouseLocations.length > 1) {
      this._indicator.onMousePositionUpdate(mouseLocations.at(-2)!, mouseLocations.at(-1)!);
    }

    return this._polyline;
  }



  override onMouseMove(mouseLocation: Vector3): void {
    if (this.mouseLocations.length > 1) this._angleSnapping.snapPoint(this.mouseLocations.at(-2)!, mouseLocation);
    super.onMouseMove(mouseLocation);
  }

  override onMouseClick(mouseLocation: Vector3): void {
    if (this.mouseLocations.length > 1) this._angleSnapping.snapPoint(this.mouseLocations.at(-2)!, mouseLocation);
    super.onMouseClick(mouseLocation);
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    this._finishCommand.isVisible = this.mouseLocations.length > 2;
    super.onMenuContextOpen(mouseEvent);
  }
}