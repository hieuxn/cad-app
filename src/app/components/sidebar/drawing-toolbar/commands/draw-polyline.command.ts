import { BufferGeometry, Group, Line, LineBasicMaterial, Object3D, Vector3 } from "three";
import { ManagedLayer } from "../../../../models/managed-layer.model";
import { ContextMenuCommandBase } from "../../../context-menu/commands/context-menu-command-base";
import { ContextMenuGenericCommand } from "../../../context-menu/commands/context-menu-generic-command";
import { DrawingCommand } from "./drawing.command";

export class DrawPolyLineCommand extends DrawingCommand {
  override name: string = "Draw Polyline";
  private isDrawingFinished: boolean = false;
  private forceFinish: boolean = false;
  private finishCommand!: ContextMenuCommandBase;
  color: number = 0x00FFFF;
  userData: Record<string, string> = {};

  protected override onInit() {
    this.finishCommand = ContextMenuGenericCommand.Create('Finish Polyline', (_) => {
      this.isDrawingFinished = this.forceFinish = true;
      this.mouseLocations.length = this.mouseLocations.length - 1;
      this.onMouseClick(this.mouseLocations[this.mouseLocations.length - 1]);
    });
    this.contextMenuCommmands.push(this.finishCommand);

    super.onInit();
  }

  override execute(layer: ManagedLayer): void {
    super.execute(layer);
    this.isDrawingFinished = false;
    this.forceFinish = false;
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    // condition to finish polyline
    if (this.forceFinish) return this.isDrawingFinished = true;
    const isClosedPolyline = mouseLocations.length >= 2 && mouseLocations[mouseLocations.length - 1].distanceToSquared(mouseLocations[0]) < 1E-2;
    if (isClosedPolyline) {
      mouseLocations[mouseLocations.length - 1] = mouseLocations[0];
    }
    return this.isDrawingFinished = isClosedPolyline;
  }

  protected override drawShapeImplementation(mouseLocations: Vector3[]): Object3D[] | null {
    const geometry = new BufferGeometry().setFromPoints(mouseLocations);
    const material = new LineBasicMaterial({ color: this.color });
    const line = new Line(geometry, material);
    line.userData = this.userData;
    line.computeLineDistances();
    line.scale.set(1, 1, 1);
    const group = new Group();
    group.add(line);
    group.name = this.userData['blockName'];
    return [group];
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    super.onMenuContextOpen(mouseEvent);

    if (this.mouseLocations.length <= 2) {
      this.finishCommand.isVisible = false;
    }
    else {
      this.finishCommand.isVisible = true;
    }

    this.contextMenuService.open(mouseEvent, this.contextMenuCommmands);
  }
}