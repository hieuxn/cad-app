import { NgClass } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { LineLoop, MeshBasicMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Plane, Raycaster, RingGeometry, Vector3 } from 'three';
import { CommandActionBase } from '../../commands/mouse-placement.command';
import { ThreeViewLifecycleBase } from '../../models/three-view-ready.model';
import { CommandManagerService } from '../../services/command-manager.service';
import { LayerService } from '../../services/layer.service';
import { MainView3DService } from '../../services/main-view-3d.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../services/mouse.service';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { IndicatorUtils } from '../../utils/dimension-indicator.utils';
import { ThreeUtils } from '../../utils/three.utils';

export type Tool = 'cursor' | 'move' | 'rotate' | 'scale'

@Component({
  selector: 'app-object-control-toolbar',
  standalone: true,
  imports: [MatIcon, NgClass],
  templateUrl: './object-control-toolbar.component.html',
  styleUrl: './object-control-toolbar.component.scss'
})
export class ObjectControlToolbarComponent extends ThreeViewLifecycleBase {
  activeTool: Tool = 'cursor'
  private _dragControls!: DragControls;
  private _rotateControls!: RotateControls;
  private _selectionService: ObjectSelectionService;
  private _layerService: LayerService;
  private _threeUtils = new ThreeUtils();

  constructor(injector: Injector) {
    super(injector);
    this._selectionService = injector.get(ObjectSelectionService);
    this._layerService = injector.get(LayerService);

    let sub = this._selectionService.hoveredObjects$.subscribe(this._onObjectHovered.bind(this))
    this.subscription.add(sub);

    sub = this._selectionService.selectedObjects$.subscribe(this._onObjectSelected.bind(this))
    this.subscription.add(sub);
  }

  override afterThreeViewReady() {
    this._dragControls = new DragControls(this.injector);
    this._rotateControls = new RotateControls(this.injector);
  }

  cursor() {
    this.activeTool = 'cursor';
    this._selectionService.enableSelectionBox(true);
    this._dragControls.deactivate();
    this._rotateControls.deactivate();
  }

  move() {
    this.activeTool = 'move';
    this._selectionService.enableSelectionBox(false);
    this._dragControls.activate();
    this._rotateControls.deactivate();
  }

  rotate() {
    this.activeTool = 'rotate';
    this._selectionService.enableSelectionBox(false);
    this._dragControls.deactivate();
    this._rotateControls.activate();
  }

  // scale() {
  //   this.activeTool = 'scale';
  //   this._controls.deactivate();
  //   this._selectionService.enableSelectionBox(false);
  // }

  private _onObjectSelected(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      const parent = this._threeUtils.getParentGroup(event.changedItem);

    }
    else if (event.change === 'remove') {

    }
  }

  private _onObjectHovered(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      this.mainView3DService.renderer.domElement.style.cursor = 'pointer';
    }
    else {
      this.mainView3DService.renderer.domElement.style.cursor = 'auto';
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
  private _selectionService: ObjectSelectionService;
  private _threeUtils = new ThreeUtils();
  selectedObjects: Object3D[] = [];

  constructor(injector: Injector) {
    this._mainView3DService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._commandService = injector.get(CommandManagerService);
    this._selectionService = injector.get(ObjectSelectionService);
  }

  activate() {
    this._subscription = new Subscription();

    let sub = this._mouseService.mouseDown$.subscribe(this._onMouseDown.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseUp$.subscribe(this._onMouseUp.bind(this));
    this._subscription.add(sub);

    sub = this._selectionService.selectedObjects$.subscribe(this._onObjectSelected.bind(this))
    this._subscription.add(sub);
  }

  deactivate() {
    this._subscription?.unsubscribe();
  }

  private _onObjectSelected(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      const group = this._threeUtils.getParentGroup(event.changedItem);
      if (!group) return;

      this.selectedObjects.push(group);
    }
    else if (event.change === 'remove') {
      this.selectedObjects.length = 0;
    }
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

    this._selectionService.deselectAll(true);
    this._isDragging = false;
    this.selectedObjects.length = 0;
    this._offsets.length = 0;
    this._originalPositions.length = 0;
  }

  private _raycaster = new Raycaster();
  private _getMousePosition(event: MouseEvent): Vector3 {
    const activeCamera = this._mainView3DService.activeCamera;
    const elevation = this._layerService.activeLayer.elevation;
    const mouseNDC = this._layerService.getMouseNDC(event);

    if (activeCamera.type === OrthographicCamera.name) {
      const pos = new Vector3(mouseNDC.x, mouseNDC.y, elevation);
      pos.unproject(activeCamera);
      return new Vector3(pos.x, pos.y, elevation);
    }
    else if (activeCamera.type == PerspectiveCamera.name) {
      const intersectionPoint = new Vector3();
      this._raycaster.setFromCamera(mouseNDC, activeCamera);
      this._raycaster.ray.intersectPlane(this._plane, intersectionPoint);

      return new Vector3(intersectionPoint.x, intersectionPoint.y, elevation);
    }

    return new Vector3();
  }
}

class RotateControls {
  private _mouseService: MouseService;
  private _layerService: LayerService;
  private _mainView3DService: MainView3DService;
  private _plane: Plane = new Plane();
  private _isRotating: boolean = false;
  private _subscription!: Subscription;
  private _offsets: Vector3[] = [];
  private _originalPositions: Vector3[] = [];
  private _commandService: CommandManagerService;
  private _selectionService: ObjectSelectionService;
  private _threeUtils = new ThreeUtils();
  private _gizmo2: LineLoop;
  selectedObjects: Object3D[] = [];

  constructor(injector: Injector) {
    this._mainView3DService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._commandService = injector.get(CommandManagerService);
    this._gizmo2 = this._create2DGizmo();
    this._selectionService = injector.get(ObjectSelectionService);
  }

  private _create2DGizmo(): LineLoop {
    const radius = 16 / IndicatorUtils.scaleFactor;
    const radialSegments = 16;
    const color = 0x8c7b21;
    const geometry = new RingGeometry(radius, radius, radialSegments);
    const material = new MeshBasicMaterial({ color: color });
    const circleOutline = new LineLoop(geometry, material);
    return circleOutline;
  }

  activate() {
    this._subscription = new Subscription();

    let sub = this._mouseService.mouseDown$.subscribe(this._onMouseDown.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));
    this._subscription.add(sub);

    sub = this._mouseService.mouseUp$.subscribe(this._onMouseUp.bind(this));
    this._subscription.add(sub);

    sub = this._selectionService.selectedObjects$.subscribe(this._onObjectSelected.bind(this))
    this._subscription.add(sub);
  }

  deactivate() {
    this._subscription?.unsubscribe();
  }

  private _onObjectSelected(event: { change: string, changedItem: Object3D }) {
    if (event.change === 'add') {
      const group = this._threeUtils.getParentGroup(event.changedItem);
      if (!group) return;

      this.selectedObjects.push(group);

      if (this._mainView3DService.activeCamera.type === OrthographicCamera.name) {
        const center = this._getCenterPosition(this.selectedObjects);
        this._gizmo2.position.copy(center);
        this._layerService.activeLayer.addObjects(this._gizmo2);
      }
      else if (this._mainView3DService.activeCamera.type === PerspectiveCamera.name) {
        // this._layerService.activeLayer.addObjects(this._gizmo3);
      }
    }
    else if (event.change === 'remove') {
      this.selectedObjects.length = 0;
      if (this._mainView3DService.activeCamera.type === OrthographicCamera.name) {
        this._layerService.activeLayer.removeObjects(this._gizmo2);
      }
      else if (this._mainView3DService.activeCamera.type === PerspectiveCamera.name) {
        // this._layerService.activeLayer.addObjects(this._gizmo3);
      }
    }
  }

  private _getCenterPosition(objects: THREE.Object3D[]): THREE.Vector3 {
    const center = new Vector3();

    if (objects.length === 0) return center;

    for (const object of objects) {
      center.add(object.position);
    }

    center.divideScalar(objects.length);

    return center;
  }

  private _onMouseDown(event: MouseEvent) {
    if (this.selectedObjects.length > 0) {
      // this._plane.setFromNormalAndCoplanarPoint(this._mainView3DService.activeCamera.getWorldDirection(this._plane.normal), this.selectedObjects[0].position);
      // this._isDragging = true;
      // const pos = this._getMousePosition(event);
      // this.selectedObjects.forEach(o => this._originalPositions.push(o.position.clone()));
      // this.selectedObjects.forEach(o => this._offsets.push(pos.clone().sub(o.position)));
    }
  }

  private _onMouseMove(event: MouseEvent) {
    if (!this._isRotating || this.selectedObjects.length === 0) return;
    // const pos = this._getMousePosition(event);
    // this.selectedObjects.forEach((o, i) => o.position.copy(pos.clone().sub(this._offsets[i])));
  }

  private _onMouseUp(event: MouseEvent) {
    if (!this._isRotating || this.selectedObjects.length === 0) return;

    // const finalPositions = this.selectedObjects.map(o => o.position.clone());
    // const originalPosition = this._originalPositions.slice();
    // const objects = this.selectedObjects.slice();

    // this._commandService.addCommand(new CommandActionBase('Move Object(s)', () => {
    //   objects.forEach((o, i) => o.position.copy(finalPositions[i]));
    // }, () => {
    //   objects.forEach((o, i) => o.position.copy(originalPosition[i]));
    // }));

    // // this._selectionService.deselectAll();
    // this._isDragging = false;
    // this.selectedObjects.length = 0;
    // this._offsets.length = 0;
    // this._originalPositions.length = 0;
  }

  private _raycaster = new Raycaster();
  private _getMousePosition(event: MouseEvent): Vector3 {
    const activeCamera = this._mainView3DService.activeCamera;
    const elevation = this._layerService.activeLayer.elevation;
    const mouseNDC = this._layerService.getMouseNDC(event);

    if (activeCamera.type === OrthographicCamera.name) {
      const pos = new Vector3(mouseNDC.x, mouseNDC.y, elevation);
      pos.unproject(activeCamera);
      return new Vector3(pos.x, pos.y, elevation);
    }
    else if (activeCamera.type == PerspectiveCamera.name) {
      const intersectionPoint = new Vector3();
      this._raycaster.setFromCamera(mouseNDC, activeCamera);
      this._raycaster.ray.intersectPlane(this._plane, intersectionPoint);

      return new Vector3(intersectionPoint.x, intersectionPoint.y, elevation);
    }

    return new Vector3();
  }
}