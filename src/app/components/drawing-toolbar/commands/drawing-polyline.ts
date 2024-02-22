import { Injectable, inject } from "@angular/core";
import { Box2, BufferGeometry, Line, LineBasicMaterial, Object3D, Vector2, Vector3 } from "three";
import { Layer } from "../../../models/layer.model";
import { HighLightService } from "../../../services/highlight.service";
import { ContextMenuGenericCommand } from "../../context-menu/commands/context-menu-generic-command";
import { DrawingCommand } from "./drawing-command";

@Injectable({ providedIn: 'root' })
export class DrawingPolyLineCommand extends DrawingCommand {
  public override name: string = "Draw Polyline";
  private isDrawingFinished: boolean = false;
  private forceFinish: boolean = false;
  private highlightService: HighLightService = inject(HighLightService);

  protected override onInit() {
    this.contextMenuCommmands.push(ContextMenuGenericCommand.Create('Finish Polyline', (_) => {
      this.isDrawingFinished = this.forceFinish = true;
      this.mouseLocations.length = this.mouseLocations.length - 1;
      this.onMouseClick(this.mouseLocations[this.mouseLocations.length - 1]);
    }));

    const size = 3; //m
    const halfWidth = new Vector2(size, size);
    this.contextMenuCommmands.push(ContextMenuGenericCommand.Create('Enable Snapping', (event) => {
      const snappingService = this.layer!.snapping;
      const mouseLocation = this.mouseLocations[this.mouseLocations.length - 1];
      const center = new Vector2(mouseLocation.x, mouseLocation.y);
      const box = new Box2(new Vector2().copy(center).sub(halfWidth), new Vector2().copy(center).add(halfWidth));
      const points = snappingService.query(box)
      // highlight near points
      for (const point of points) {
        const point3d = new Vector3(point.x, point.y, this.layer!.elevation);
        if (this.mouseLocations.slice(-3).filter(p => p.distanceToSquared(point3d) < 1E-3).length > 0) continue;
        if (point.distanceTo(center) < 1E-3) continue;
        this.highlightService.highlightPoint(point, this.layer!.elevation);
      }
    }));
  }

  public override execute(layer: Layer): void {
    super.execute(layer);
    this.isDrawingFinished = false;
    this.forceFinish = false;
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    if (this.highlightService.isHighlight()) {
      mouseLocations[mouseLocations.length - 1] = this.highlightService.getPosition(mouseLocations[mouseLocations.length - 1]);
      this.highlightService.clearHighlight();
    }

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
    const material = new LineBasicMaterial({ color: 0x00ffff });
    const line = new Line(geometry, material);
    return [line];
  }

  protected override onMenuContextOpen(mouseEvent: MouseEvent): void {
    super.onMenuContextOpen(mouseEvent);
    if (this.mouseLocations.length <= 1) {
      // The user has not started drawing yet
      return;
    }
    if (this.mouseLocations.length <= 2) {
      // Remove the 'Finish Polyline' command because the initial line has not been drawn
      this.contextMenuWrapper.value.open(mouseEvent, this.contextMenuCommmands.slice(1));
    }
    else {
      this.contextMenuWrapper.value.open(mouseEvent, this.contextMenuCommmands);
    }
  }
}