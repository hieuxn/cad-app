import { NgClass } from '@angular/common';
import { Component, Injector, OnDestroy } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { Object3D, Plane, Vector3 } from 'three';
import { CommandActionBase } from '../../commands/mouse-placement.command';
import { ThreeViewLifecycleBase } from '../../models/three-view-ready.model';
import { CommandManagerService } from '../../services/command-manager.service';
import { LayerService } from '../../services/layer.service';
import { MainView3DService } from '../../services/main-view-3d.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../services/mouse.service';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { ThreeUtils } from '../../utils/three.utils';

export type Tool = 'cursor' | 'move' | 'rotate' | 'scale'

@Component({
  selector: 'app-object-control-toolbar',
  standalone: true,
  imports: [MatIcon, NgClass],
  templateUrl: './object-control-toolbar.component.html',
  styleUrl: './object-control-toolbar.component.scss'
})
export class ObjectControlToolbarComponent extends ThreeViewLifecycleBase implements OnDestroy {
  activeTool: Tool = 'cursor'
  private _controls!: DragControls;
  private _selectionService: ObjectSelectionService;
  private _subscription = new Subscription();
  private _threeUtils = new ThreeUtils();

  constructor(private _injector: Injector) {
    super(_injector);
    this._selectionService = _injector.get(ObjectSelectionService);

    let sub = this._selectionService.hoveredObjects$.subscribe(this._onObjectHovered.bind(this))
    this._subscription.add(sub);

    sub = this._selectionService.selectedObjects$.subscribe(this._onObjectSelected.bind(this))
    this._subscription.add(sub);

    this._subscription.add(sub);
  }

  override afterThreeViewReady() {
    this._controls = new DragControls(this._injector);

  }

  ngOnDestroy(): void {
    this._subscription.unsubscribe();
  }

  cursor() {
    this.activeTool = 'cursor';
    this._selectionService.enableSelectionBox(true);
    this._controls.deactivate();
  }

  move() {
    this.activeTool = 'move';
    this._controls.activate();
    this._selectionService.enableSelectionBox(false);
  }

  rotate() {
    this.activeTool = 'rotate';
    this._controls.deactivate();
    this._selectionService.enableSelectionBox(false);
  }

  scale() {
    this.activeTool = 'scale';
    this._controls.deactivate();
    this._selectionService.enableSelectionBox(false);
  }

  private _onObjectHovered(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      this.mainView3DService.renderer.domElement.style.cursor = 'pointer';
    }
    else {
      this.mainView3DService.renderer.domElement.style.cursor = 'auto';
    }
  }

  private _onObjectSelected(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      const group = this._threeUtils.getParentGroup(event.changedItem);
      if (!group) return;

      this._controls.selectedObjects.push(group);
    }
    else if (event.change === 'remove') {
      this._controls.selectedObjects.length = 0;
    }
  }
}


class DragControls {
  private _mouseService: MouseService;
  private _layerService: LayerService;
  private _mainView3DService: MainView3DService;
  private _plane: Plane = new Plane();
  private _isDragging: boolean = false;
  private _subscription!: Subscription;
  private _offsets: Vector3[] = [];
  private _originalPositions: Vector3[] = [];
  private _commandService: CommandManagerService;
  selectedObjects: Object3D[] = [];

  constructor(injector: Injector) {
    this._mainView3DService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._commandService = injector.get(CommandManagerService);
  }

  activate() {
    this._subscription = new Subscription();

    let sub = this._mouseService.mouseDown$.subscribe(this._onMouseDown.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseUp$.subscribe(this._onMouseUp.bind(this));
    this._subscription.add(sub);
  }

  deactivate() {
    this._subscription?.unsubscribe();
  }

  private _onMouseDown(event: MouseEvent) {
    if (this.selectedObjects.length > 0) {
      this._plane.setFromNormalAndCoplanarPoint(this._mainView3DService.activeCamera.getWorldDirection(this._plane.normal), this.selectedObjects[0].position);
      this._isDragging = true;
      const pos = this._getMousePosition(event);
      this.selectedObjects.forEach(o => this._originalPositions.push(o.position.clone()));
      this.selectedObjects.forEach(o => this._offsets.push(pos.clone().sub(o.position)));
    }
  }

  private _onMouseMove(event: MouseEvent) {
    if (!this._isDragging || this.selectedObjects.length === 0) return;
    const pos = this._getMousePosition(event);
    this.selectedObjects.forEach((o, i) => o.position.copy(pos.clone().sub(this._offsets[i])));
  }

  private _onMouseUp(event: MouseEvent) {
    if (!this._isDragging || this.selectedObjects.length === 0) return;

    const finalPositions = this.selectedObjects.map(o => o.position.clone());
    const originalPosition = this._originalPositions.slice();
    const objects = this.selectedObjects.slice();

    this._commandService.addCommand(new CommandActionBase('Move Object(s)', () => {
      objects.forEach((o, i) => o.position.copy(finalPositions[i]));
    }, () => {
      objects.forEach((o, i) => o.position.copy(originalPosition[i]));
    }));

    this._isDragging = false;
    this.selectedObjects.length = 0;
    this._offsets.length = 0;
    this._originalPositions.length = 0;
  }

  private _getMousePosition(event: MouseEvent): Vector3 {
    const activeCamera = this._mainView3DService.activeCamera;
    const elevation = this._layerService.activeLayer.elevation;
    const mouseNDC = this._layerService.getMouseNDC(event);
    const pos = new Vector3(mouseNDC.x, mouseNDC.y, 0);
    pos.applyMatrix4(activeCamera.projectionMatrixInverse).add(activeCamera.position);

    return new Vector3(pos.x, pos.y, elevation);
  }
}