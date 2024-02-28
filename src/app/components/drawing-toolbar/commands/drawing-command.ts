import { Inject, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Box2, Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { ManagedLayer } from '../../../models/layer.model';
import { ContextMenuService, ContextMenuWrapper } from '../../../services/context-menu.service';
import { CoordinateService } from '../../../services/coordinate.service';
import { HighLightService } from '../../../services/highlight.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../../services/mouse.service';
import { ViewerService } from '../../../services/viewer.serive';
import { ContextMenuCommandBase } from '../../context-menu/commands/context-menu-command-base';
import { ContextMenuGenericCommand } from '../../context-menu/commands/context-menu-generic-command';

@Injectable({ providedIn: "root" })
export abstract class DrawingCommand {
  public abstract name: string;
  protected drawOnMouseDown: boolean = true;
  protected mouseLocations: Vector3[] = [];
  protected subscriptions: Subscription | null = null;
  protected contextMenuWrapper!: ContextMenuWrapper;
  protected layer: ManagedLayer | null = null;
  protected contextMenuCommmands: ContextMenuCommandBase[] = [];
  private object3Ds: Object3D[] | null = [];
  private mouseUpCount: number = 0;

  constructor(
    @Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    contextMenuService: ContextMenuService,
    private viewerService: ViewerService,
    private coordinateService: CoordinateService,
    private highlightService: HighLightService
  ) {
    this.contextMenuWrapper ??= contextMenuService.lazyGet();
    this.onInit();
  }

  public execute(layer: ManagedLayer) {
    if (!layer) return;
    this.layer = layer;
    this.plane = new Plane(new Vector3(0, 0, 1), -this.layer.elevation);
    this.initEvents();
  }

  public cancel() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe()
      this.subscriptions = null;
      this.object3Ds = null;
      this.mouseUpCount = 0;
      this.mouseLocations.length = 0;
    }
  }

  protected onInit() {

    const snappingCommand = ContextMenuGenericCommand.Create('Enable snapping to grid', (event) => {
      snappingCommand.isVisible = false;
      unSnappingCommand.isVisible = true;
      this.coordinateService.gridSnap = true;
    });

    const unSnappingCommand = ContextMenuGenericCommand.Create('Disable snapping to grid', (event) => {
      snappingCommand.isVisible = true;
      unSnappingCommand.isVisible = false;
      this.coordinateService.gridSnap = false;
    }, false);

    this.contextMenuCommmands.push(snappingCommand);
    this.contextMenuCommmands.push(unSnappingCommand);

    const size = 3; //m
    const halfWidth = new Vector2(size, size);
    const snapCommand = ContextMenuGenericCommand.Create(`Highlight near snap points (${size} meters)`, (event) => {
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
        this.coordinateService.gridSnap = false;
      }
    });
    this.contextMenuCommmands.push(snapCommand);

    const cancelCommand = ContextMenuGenericCommand.Create('Cancel', (event) => {
      if (this.object3Ds) {
        this.layer?.removeObjects(...this.object3Ds);
      }
      this.cancel();
    });
    this.contextMenuCommmands.push(cancelCommand);
  }

  protected onKeyDown(event: KeyboardEvent) {
  }

  protected onKeyUp(event: KeyboardEvent) {
  }

  protected onMouseClick(mouseLocation: Vector3) {
    if (this.mouseLocations.length > 0) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    else this.mouseLocations.push(mouseLocation);
    ++this.mouseUpCount;

    const isFinished = this.isFinished(this.mouseLocations);
    if (this.mouseLocations.length > 0) this.drawShape();
    if (!isFinished) return;

    this.cancel();
  }

  protected onMouseMove(mouseLocation: Vector3) {
    if (this.mouseLocations.length == 0) return;
    if (this.mouseUpCount == this.mouseLocations.length) this.mouseLocations.push(mouseLocation);
    else if (this.mouseUpCount + 1 == this.mouseLocations.length) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    if (this.mouseLocations.length > 0) this.drawShape();
  }

  protected onMenuContextOpen(mouseEvent: MouseEvent) {
  }

  protected isFinished(mouseLocations: Vector3[]): boolean {
    if (this.highlightService.isHighlight()) {
      mouseLocations[mouseLocations.length - 1] = this.highlightService.getPosition(mouseLocations[mouseLocations.length - 1]);
      this.highlightService.clearHighlight();
    }
    return false;;
  }

  protected abstract drawShapeImplementation(mouseLocations: Vector3[]): Object3D[] | null;

  private initEvents() {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this.mouseService.mouseDown$
      .subscribe((event: MouseEvent) => {
        this.handleMouseDown(event);
      }));

    this.subscriptions.add(this.mouseService.mouseUp$
      .subscribe((event: MouseEvent) => {
        this.handleMouseUp(event);
      }));

    this.subscriptions.add(this.mouseService.mouseMove$
      .subscribe((event: MouseEvent) => {
        this.handleMouseMove(event);
      }));

    this.subscriptions.add(this.mouseService.mouseContextMenu$
      .subscribe((event: MouseEvent) => {
        this.onMenuContextOpen(event);
      }));

    this.subscriptions.add(this.coordinateService.show());
  }

  private raycaster: Raycaster = new Raycaster();
  private plane!: Plane;

  private raycastMouse(event: MouseEvent): Vector3 | null {
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(mouse, this.viewerService.view3D.activeCamera);
    const pointerPosition = new Vector3();
    this.raycaster.ray.intersectPlane(this.plane, pointerPosition);
    if (!pointerPosition) return null;
    return pointerPosition;
  }

  private handleMouseDown(event: MouseEvent) {
    if (event.button != 0) return;
    if (!this.drawOnMouseDown) return;

    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;
    if (this.coordinateService.gridSnap) this.coordinateService.snapVec3(pointerPosition)
    this.onMouseClick(pointerPosition);
  }

  private handleMouseUp(event: MouseEvent) {
    if (event.button != 0) return;
    if (this.drawOnMouseDown) return;

    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;

    pointerPosition.z = this.layer!.elevation;
    if (this.coordinateService.gridSnap) this.coordinateService.snapVec3(pointerPosition)
    this.onMouseClick(pointerPosition);
  }

  private handleMouseMove(event: MouseEvent) {
    if (event.button != 0) return;
    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;

    pointerPosition.z = this.layer!.elevation;
    if (this.coordinateService.gridSnap) this.coordinateService.snapVec3(pointerPosition)
    this.onMouseMove(pointerPosition);
  }

  private drawShape() {
    if (this.object3Ds) {
      this.layer?.removeObjects(...this.object3Ds);
    }


    this.object3Ds = this.drawShapeImplementation(this.mouseLocations)
    if (!this.object3Ds) {
      return;
    }

    if (this.layer) {
      this.layer.addObjects(...this.object3Ds);
    }
  }
}
