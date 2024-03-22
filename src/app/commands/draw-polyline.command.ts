import { BufferGeometry, Group, Line, LineBasicMaterial, Object3D, Vector3 } from "three";
import { ContextMenuCommandBase, ContextMenuGenericCommand } from "./context-menu.command";
import { MousePlacementCommand } from "./mouse-placement.command";

export class DrawPolyLineCommand extends MousePlacementCommand {
  override name: string = "Draw Polyline";
  private _isDrawingFinished: boolean = false;
  private _forceFinish: boolean = false;
  private _finishCommand!: ContextMenuCommandBase;
  private _polyline!: Group;
  color: number = 0x00FFFF;
  userData: Record<string, string> = {};

  protected override onInit() {
    this._finishCommand = ContextMenuGenericCommand.create('Finish Polyline', (_) => {
      this._isDrawingFinished = this._forceFinish = true;
      this.mouseLocations.length = this.mouseLocations.length - 1;
      this.onMouseClick(this.mouseLocations[this.mouseLocations.length - 1]);
    });
    this.contextMenuCommmands.push(this._finishCommand);

    super.onInit();
  }

  override execute(): void {
    super.execute();
    this._isDrawingFinished = this._forceFinish = false;
    this._polyline = this._createPolyline([]);
    this.addToScene(this._polyline);
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);

    if (this._forceFinish) {
      this._reCreatePolyline(mouseLocations)
      return this._isDrawingFinished = true;
    }

    const isPolylineClosed = mouseLocations.length >= 2 && mouseLocations[mouseLocations.length - 1].distanceToSquared(mouseLocations[0]) < 1E-2;
    if (isPolylineClosed) {
      mouseLocations[mouseLocations.length - 1] = mouseLocations[0];
      this._reCreatePolyline(mouseLocations)
    }
    

    return this._isDrawingFinished = isPolylineClosed;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    (this._polyline.children[0] as Line).geometry.setFromPoints(mouseLocations);
    return this._polyline;
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    this._finishCommand.isVisible = this.mouseLocations.length > 2;
    super.onMenuContextOpen(mouseEvent);
  }

  private _createPolyline(points: Vector3[]): Group {
    const geometry = new BufferGeometry().setFromPoints(points);
    const material = new LineBasicMaterial({ color: this.color });
    const line = new Line(geometry, material);
    line.userData = this.userData;
    line.scale.set(1, 1, 1);
    const polyline = new Group();
    polyline.add(line);
    polyline.name = this.userData['blockName'];
    return polyline;
  }

  private _reCreatePolyline(mouseLocations: Vector3[]) {
    this.removeFromScene(this._polyline);
    this._polyline = this._createPolyline(mouseLocations);
    this.addToScene(this._polyline)
  }
}