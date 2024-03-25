import { KeyValue } from '@angular/common';
import { Injector } from '@angular/core';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { Group, Object3D, Vector3 } from 'three';
import { CommandManagerService } from '../services/command-manager.service';
import { ContextMenuService } from '../services/context-menu.service';
import { CoordinateService } from '../services/coordinate.service';
import { LayerService } from '../services/layer.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../services/mouse.service';
import { ThreeObjectCreationService } from '../services/three-object-creation.service';
import { ContextMenuCommandBase, ContextMenuGenericCommand } from './context-menu.command';

export abstract class CommandBase {
  abstract description: string;
  abstract execute(): void;
  abstract undo(): void;
}

export class CommandActionBase implements CommandBase {
  constructor(public description: string, private _execute: () => void, private _undo: () => void) { }
  execute(): void {
    this._execute();
  }

  undo(): void {
    this._undo();
  }
}

export abstract class MousePlacementCommand {
  abstract name: string;
  protected drawOnMouseDown: boolean = true;
  protected mouseLocations: Vector3[] = [];
  protected subscriptions: Subscription | null = null;
  protected contextMenuCommmands: ContextMenuCommandBase[] = [];
  protected contextMenuService: ContextMenuService;
  protected objectCreatorService: ThreeObjectCreationService;
  protected showPreviewWithoutClicking: boolean = false;
  protected _layerService: LayerService;
  private _object3D: Object3D | null = null;
  private _mouseUpCount: number = 0;
  private _coordinateService: CoordinateService;
  private _mouseService: MouseService;
  protected commandService: CommandManagerService;

  constructor(injector: Injector) {
    this._coordinateService = injector.get(CoordinateService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._layerService = injector.get(LayerService);
    this.commandService = injector.get(CommandManagerService);
    this.contextMenuService = injector.get(ContextMenuService);
    this.objectCreatorService = injector.get(ThreeObjectCreationService);
    this.onInit();
  }

  execute(): any {
    this._initEvents();
  }

  cancel() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe()
      this.subscriptions = null;
      this._object3D = null;
      this._mouseUpCount = 0;
      this.mouseLocations.length = 0;
    }
  }

  protected onInit() {
    this._coordinateService.gridSnap = true;
    const snappingCommand = ContextMenuGenericCommand.create('Enable snapping to grid', (event) => {
      snappingCommand.isVisible = false;
      unSnappingCommand.isVisible = true;
      this._coordinateService.gridSnap = true;
    }, false);

    const unSnappingCommand = ContextMenuGenericCommand.create('Disable snapping to grid', (event) => {
      snappingCommand.isVisible = true;
      unSnappingCommand.isVisible = false;
      this._coordinateService.gridSnap = false;
    }, true);

    this.contextMenuCommmands.push(snappingCommand);
    this.contextMenuCommmands.push(unSnappingCommand);

    const cancelCommand = ContextMenuGenericCommand.create('Cancel', (event) => {
      if (this._object3D) {
        this.removeFromScene(this._object3D);
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

    if (this.mouseLocations.length > 0) this._object3D = this.onCommandExecute(this.mouseLocations);

    const isFinished = this.isFinished(this.mouseLocations);
    if (!isFinished) return;

    this.cancel();
  }

  protected onMouseMove(mouseLocation: Vector3) {
    if (false == this.showPreviewWithoutClicking && this.mouseLocations.length == 0) return;
    if (this._mouseUpCount == this.mouseLocations.length) this.mouseLocations.push(mouseLocation);
    else if (this._mouseUpCount + 1 == this.mouseLocations.length) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    if (this.mouseLocations.length > 0) this._object3D = this.onCommandExecute(this.mouseLocations);
  }

  protected onMenuContextOpen(mouseEvent: MouseEvent) {
    this.contextMenuService.open(mouseEvent, this.contextMenuCommmands);
  }

  protected isFinished(mouseLocations: Vector3[]): boolean {
    if (this._layerService.highlightUtils.isHighlight()) {
      mouseLocations[mouseLocations.length - 1] = this._layerService.highlightUtils.getPosition(mouseLocations[mouseLocations.length - 1]);
      this._layerService.highlightUtils.clearHighlight();
    }
    return false;;
  }

  protected abstract onCommandExecute(mouseLocations: Vector3[]): Object3D | null;

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

  protected addToScene(object: Object3D) {
    this._layerService.activeLayer.addObjects(object);
  }

  protected removeFromScene(object: Object3D) {
    this._layerService.activeLayer.removeObjects(object);
  }
}

export class ReactiveMousePlacementCommand extends MousePlacementCommand {
  private _sourceSubject = new Subject<[BehaviorSubject<KeyValue<string, Group>>, Vector3[]]>();
  private _destSubject = new BehaviorSubject<KeyValue<string, Group>>({ key: '', value: new Group() });
  private _isFinished = false;
  private _currentParent: Group | undefined = undefined;

  source$ = this._sourceSubject.asObservable();
  name: string;

  constructor(name: string, showPreview: boolean, injector: Injector) {
    super(injector);
    this.name = name;
    this.showPreviewWithoutClicking = showPreview;
  }

  override execute(): void {
    this._isFinished = false;
    this._currentParent = undefined;
    super.execute();
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    // call super to enable snapping
    super.isFinished(mouseLocations);
    this._isFinished = mouseLocations.length > 0
    return this._isFinished;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D | null {
    this._sourceSubject.next([this._destSubject, mouseLocations])
    if (!this._destSubject.value) return null;

    const { key, value } = this._destSubject.value;

    if (undefined === this._currentParent && false === this._isFinished) {
      this._currentParent = this._layerService.activeLayer.objects.get(key) as Group;
      this._currentParent.add(value);
      return null;
    }
    else if (this._currentParent) {
      const lastChild = this._currentParent.children.at(-1);
      if (lastChild) this._currentParent.remove(lastChild);
      this._currentParent.add(value);
      return null;
    }

    return this._destSubject.value.value;
  }
}