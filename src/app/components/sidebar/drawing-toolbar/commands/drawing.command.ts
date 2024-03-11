import { Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { Object3D, Vector3 } from 'three';
import { ManagedLayer } from '../../../../models/managed-layer.model';
import { ContextMenuService } from '../../../../services/context-menu.service';
import { CoordinateService } from '../../../../services/coordinate.service';
import { LayerService } from '../../../../services/layer.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../../../services/mouse.service';
import { ContextMenuCommandBase } from '../../../context-menu/commands/context-menu-command-base';
import { ContextMenuGenericCommand } from '../../../context-menu/commands/context-menu-generic-command';

export abstract class DrawingCommand {
  abstract name: string;
  protected drawOnMouseDown: boolean = true;
  protected mouseLocations: Vector3[] = [];
  protected subscriptions: Subscription | null = null;
  protected contextMenuCommmands: ContextMenuCommandBase[] = [];
  protected contextMenuService: ContextMenuService;
  private _object3Ds: Object3D[] | null = [];
  private _mouseUpCount: number = 0;
  private _coordinateService: CoordinateService;
  private _mouseService: MouseService;
  private _layerService: LayerService;

  constructor(injector: Injector) {
    this._coordinateService = injector.get(CoordinateService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._layerService = injector.get(LayerService);
    this.contextMenuService = injector.get(ContextMenuService);
    this.onInit();
  }

  execute(layer: ManagedLayer) {
    this._initEvents();
  }

  cancel() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe()
      this.subscriptions = null;
      this._object3Ds = null;
      this._mouseUpCount = 0;
      this.mouseLocations.length = 0;
    }
  }

  protected onInit() {

    this._coordinateService.gridSnap = true;
    const snappingCommand = ContextMenuGenericCommand.Create('Enable snapping to grid', (event) => {
      snappingCommand.isVisible = false;
      unSnappingCommand.isVisible = true;
      this._coordinateService.gridSnap = true;
    }, false);

    const unSnappingCommand = ContextMenuGenericCommand.Create('Disable snapping to grid', (event) => {
      snappingCommand.isVisible = true;
      unSnappingCommand.isVisible = false;
      this._coordinateService.gridSnap = false;
    }, true);

    this.contextMenuCommmands.push(snappingCommand);
    this.contextMenuCommmands.push(unSnappingCommand);

    const cancelCommand = ContextMenuGenericCommand.Create('Cancel', (event) => {
      if (this._object3Ds) {
        this._layerService.activeLayer!.removeObjects(this._object3Ds);
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
    ++this._mouseUpCount;

    const isFinished = this.isFinished(this.mouseLocations);
    if (this.mouseLocations.length > 0) this._drawShape();
    if (!isFinished) return;

    this.cancel();
  }

  protected onMouseMove(mouseLocation: Vector3) {
    if (this.mouseLocations.length == 0) return;
    if (this._mouseUpCount == this.mouseLocations.length) this.mouseLocations.push(mouseLocation);
    else if (this._mouseUpCount + 1 == this.mouseLocations.length) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    if (this.mouseLocations.length > 0) this._drawShape();
  }

  protected onMenuContextOpen(mouseEvent: MouseEvent) {
  }

  protected isFinished(mouseLocations: Vector3[]): boolean {
    if (this._layerService.highlightUtils.isHighlight()) {
      mouseLocations[mouseLocations.length - 1] = this._layerService.highlightUtils.getPosition(mouseLocations[mouseLocations.length - 1]);
      this._layerService.highlightUtils.clearHighlight();
    }
    return false;;
  }

  protected abstract drawShapeImplementation(mouseLocations: Vector3[]): Object3D[] | null;

  private _initEvents() {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this._mouseService.mouseDown$
      .subscribe((event: MouseEvent) => {
        this._handleMouseDown(event);
      }));

    this.subscriptions.add(this._mouseService.mouseUp$
      .subscribe((event: MouseEvent) => {
        this._handleMouseUp(event);
      }));

    this.subscriptions.add(this._mouseService.mouseMove$
      .subscribe((event: MouseEvent) => {
        this._handleMouseMove(event);
      }));

    this.subscriptions.add(this._mouseService.mouseContextMenu$
      .subscribe((event: MouseEvent) => {
        this.onMenuContextOpen(event);
      }));

    this.subscriptions.add(this._coordinateService.show());
  }

  private _handleMouseDown(event: MouseEvent) {
    if (event.button != 0) return;
    if (!this.drawOnMouseDown) return;

    const pointerPosition = this._layerService.convertMouseEventToWorldSpace(event);
    if (!pointerPosition) return;
    if (this._coordinateService.gridSnap) this._coordinateService.snapVec3(pointerPosition)
    this.onMouseClick(pointerPosition);
  }

  private _handleMouseUp(event: MouseEvent) {
    if (event.button != 0) return;
    if (this.drawOnMouseDown) return;

    const pointerPosition = this._layerService.convertMouseEventToWorldSpace(event);
    if (!pointerPosition) return;

    pointerPosition.z = this._layerService.activeLayer!.elevation;
    if (this._coordinateService.gridSnap) this._coordinateService.snapVec3(pointerPosition)
    this.onMouseClick(pointerPosition);
  }

  private _handleMouseMove(event: MouseEvent) {
    if (event.button != 0) return;
    const pointerPosition = this._layerService.convertMouseEventToWorldSpace(event);
    if (!pointerPosition) return;

    pointerPosition.z = this._layerService.activeLayer.elevation;
    if (this._coordinateService.gridSnap) this._coordinateService.snapVec3(pointerPosition)
    this.onMouseMove(pointerPosition);
  }

  private _drawShape() {
    if (this._object3Ds) {
      this._layerService.activeLayer.removeObjects(this._object3Ds);
    }

    this._object3Ds = this.drawShapeImplementation(this.mouseLocations)
    if (!this._object3Ds) return;

    this._layerService.activeLayer.addObjects(this._object3Ds);
  }
}
