import { Injectable, Injector } from "@angular/core";
import { Subscription } from "rxjs";
import THREE, { Material, MeshStandardMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Raycaster, Vector2 } from "three";
import { SelectionBox, SelectionHelper } from "three/examples/jsm/Addons.js";
import { ManagedLayer } from "../models/managed-layer.model";
import { ObservableSlim } from "../models/observable-collection.model";
import { ThreeViewLifecycleBase } from "../models/three-view-ready.model";
import { ThreeUtils } from "../utils/three.utils";
import { LayerService } from "./layer.service";
import { MainView3DService } from "./main-view-3d.service";
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from "./mouse.service";

export type selectionOrHover = 'selection' | 'hover';
export type addOrRemove = 'add' | 'remove'

@Injectable({ providedIn: 'root' })
export class ObjectSelectionService extends ThreeViewLifecycleBase {
  private _selectedObjectsSubject = new ObservableSlim<Object3D>();
  private _hoveredObjectsSubject = new ObservableSlim<Object3D>();
  private _hoveredObjectMap: Map<string, [Object3D, Material]> = new Map<string, [Object3D, Material]>();
  private _selectedMaterial!: MeshStandardMaterial;
  private _hoveredMaterial!: MeshStandardMaterial;
  private _mainViewService!: MainView3DService;
  private _layerService!: LayerService;
  private _mouseService!: MouseService;
  private _selectionBox!: SelectionBox;
  private _selectionHelper!: SelectionHelper;
  private _raycaster: Raycaster = new Raycaster();
  private _idOffset: number = 0;
  private _selectionBoxes = new Map<string, SelectionBox>()
  private _isLeftCicked = false;
  private _threeUtils = new ThreeUtils();

  selectedObjects$ = this._selectedObjectsSubject.items$;
  hoveredObjects$ = this._hoveredObjectsSubject.items$;
  selectedObjectMap: Map<string, [Object3D, Material]> = new Map<string, [Object3D, Material]>();

  constructor(injector: Injector) {
    super(injector);
  }

  protected override afterThreeViewReady(afterThreeViewReady: MainView3DService) {
    this._mainViewService = this.injector.get(MainView3DService);
    this._mouseService = this.injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._layerService = this.injector.get(LayerService);

    this._selectedMaterial = new MeshStandardMaterial({ depthTest: true, depthWrite: true, emissive: 0x00FF00, color: 0x00FF00, emissiveIntensity: 0.9 });
    this._hoveredMaterial = new MeshStandardMaterial({ depthTest: true, depthWrite: true, emissive: 0xF44A3E, color: 0xF44A3E, emissiveIntensity: 0.9 });

    this._raycaster.params.Line.threshold = 0.2;

    const renderer = this._mainViewService.renderer;
    const scene = this._mainViewService.scene;
    const camera = this._mainViewService.activeCamera;

    this._selectionHelper = new SelectionHelper(renderer, 'selectBox');
    this._selectionHelper.enabled = false;

    this._selectionBoxes.set(camera.type, this._selectionBox = new SelectionBox(camera, scene));

    this.activate();
  }

  activate() {
    this.enableSelectionBox(true);

    if (this.subscription.closed) this.subscription = new Subscription();

    let sub = this._layerService.activeLayer$.subscribe(this._onActiveLayerChanged.bind(this));

    sub = this._mouseService.mouseMove$.subscribe(event => {
      const mousePosition = this._layerService.getMouseNDC(event);
      this._hover(mousePosition);
    });
    this.subscription.add(sub);

    sub = this._mouseService.wheel$.subscribe(event => {
      const camera = this._mainViewService.activeCamera as OrthographicCamera | PerspectiveCamera;
      const zoom = Math.min(1, camera.zoom);
      this._raycaster.params.Line.threshold = 0.2 / zoom * zoom;
    });
    this.subscription.add(sub);

    sub = this._mouseService.mouseDown$.subscribe(event => {
      if (event.button !== 0) return;
      const mousePosition = this._layerService.getMouseNDC(event);
      this._handleSelection(mousePosition, event.ctrlKey);
    })
    this.subscription.add(sub);

    sub = this._mainViewService.onCameraChanged$.subscribe(event => {
      if (this._layerService.activeLayer) this._onActiveLayerChanged(this._layerService.activeLayer);
    });
    this.subscription.add(sub);

    sub = this._mouseService.mouseDown$.subscribe(this._onSelectionBoxStart.bind(this));
    this.subscription.add(sub);

    sub = this._mouseService.mouseMove$.subscribe(this._onSelectionBoxUpdate.bind(this));
    this.subscription.add(sub);

    sub = this._mouseService.mouseUp$.subscribe(this._onSelectionBoxFinish.bind(this));
    this.subscription.add(sub);

    sub = this._mainViewService.onCameraChanged$.subscribe(event => {
      const newCamera = event.camera;
      if (undefined === this._selectionBoxes.get(newCamera.type)) {
        this._selectionBoxes.set(newCamera.type, new SelectionBox(newCamera, this._mainViewService.scene));
      }
      this._selectionBox = this._selectionBoxes.get(newCamera.type)!;
    });
    this.subscription.add(sub);
  }

  enableSelectionBox(enable: boolean) {
    this._selectionHelper.enabled = enable;
  }

  deactivate() {
    this.enableSelectionBox(false);
    this.subscription?.unsubscribe();
  }

  private _onActiveLayerChanged(activeLayer: ManagedLayer) {
    this._idOffset = this.mainView3DService.activeCamera.type === OrthographicCamera.name ? 0 : 1;
    this._raycaster.layers.set(activeLayer.id + this._idOffset);
  }

  private _onSelectionBoxStart(event: MouseEvent) {
    if (event.button !== 0) {
      this._isLeftCicked = false;
      return;
    }

    this.deselect(this._selectionBox.collection, true);

    const mouse = this._layerService.getMouseNDC(event);
    this._selectionBox.startPoint.set(mouse.x, mouse.y, 0.5);
    this._isLeftCicked = true;
  }

  private _onSelectionBoxUpdate(event: MouseEvent) {
    if (false === this._isLeftCicked) {
      this._selectionHelper.element.style.display = 'none';
    }

    const activeId = this._layerService.activeLayer.id;

    if (this._selectionHelper.isDown) {

      this.deselect(this._selectionBox.collection, false);

      const mouse = this._layerService.getMouseNDC(event);
      this._selectionBox.endPoint.set(mouse.x, mouse.y, 0.5);

      const allSelected = this._selectionBox.select();
      this.select(allSelected.filter(item => item.layers.isEnabled(activeId + this._idOffset)), false);
    }
  }

  private _onSelectionBoxFinish(event: MouseEvent) {
    if (event.button !== 0) return;

    const activeId = this._layerService.activeLayer.id;
    const mouse = this._layerService.getMouseNDC(event);
    this._selectionBox.endPoint.set(mouse.x, mouse.y, 0.5);

    const allSelected = this._selectionBox.select();

    this._notify(allSelected.filter(item => item.layers.isEnabled(activeId + this._idOffset)), 'add', 'selection');
  }


  private _hover(mouseNDC: Vector2) {
    if (this._selectionHelper.isDown) return;

    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);
    if (intersections.length === 0) {
      this._unhoverAll(true);
    }

    let resetHover = true;
    for (const intersection of intersections) {
      const parent = this._threeUtils.getParentGroup(intersection.object);
      if (!parent) continue;

      const hoverObjs: Object3D[] = [];
      for (const obj of this._threeUtils.flatChildren(parent)) {
        if ('material' in obj
          && obj.material instanceof Material
          && obj.material !== this._hoveredMaterial
          && obj.material !== this._selectedMaterial
          && undefined === this._hoveredObjectMap.get(obj.uuid)) {

          if (resetHover) {
            resetHover = false;
            this._unhoverAll(true);
          }

          const originalMaterial = this.selectedObjectMap.get(obj.uuid)?.[1] || obj.material.clone();
          this._hoveredObjectMap.set(obj.uuid, [obj, originalMaterial]);
          hoverObjs.push(obj);
          obj.material = this._hoveredMaterial;
        }
      }

      if (hoverObjs.length > 0) this._notify(hoverObjs, 'add', 'hover');
    }
  }

  private _unhoverAll(notify: boolean) {
    const notifyObjs: Object3D[] = [];

    for (const [key, [obj, material]] of this._hoveredObjectMap) {
      if ('material' in obj
        && obj.material instanceof Material
        && material !== this._hoveredMaterial
        && material !== this._selectedMaterial) {
        obj.material = material;
        this._unhover(obj);
        notifyObjs.push(obj);
      }
    }

    if (notify) this._notify(notifyObjs, 'remove', 'hover');
  }

  private _handleSelection(mouseNDC: THREE.Vector2, multiSelect: boolean): void {
    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);

    if (intersections.length > 0) {
      const parent = this._threeUtils.getParentGroup(intersections[0].object); // Select the first intersected object
      if (!parent) return;

      let deselectAll = true;
      const selectObjs: Object3D[] = [];
      const deselectObjs: Object3D[] = [];
      for (const obj of this._threeUtils.flatChildren(parent)) {
        if (multiSelect) {
          if (this.selectedObjectMap.has(obj.uuid)) {
            deselectObjs.push(obj)
          }
          else {
            selectObjs.push(obj);
          }
        }
        else if (this.selectedObjectMap.has(obj.uuid)) {
          deselectObjs.push(obj);
        }
        else {
          if (deselectAll) {
            deselectAll = false;
            this._unhoverAll(true);
            this.deselectAll(true);
          }
          selectObjs.push(obj);
        }
      }

      if (selectObjs.length > 0) this.select(selectObjs, true);
      if (deselectObjs.length > 0) this.deselect(deselectObjs, true);
    }
    else this.deselectAll(true);
  }


  select(objects: Object3D[], notify: boolean): number {
    const oldSize = this.selectedObjectMap.size;
    const notifyObjs: Object3D[] = []

    for (const obj of objects) {
      const originalMaterial = this._unhover(obj);
      if (!originalMaterial) continue;

      this.selectedObjectMap.set(obj.uuid, [obj, originalMaterial]);
      (obj as any).material = this._selectedMaterial;

      notifyObjs.push(obj);
    }


    if (notify && this.selectedObjectMap.size > oldSize) {
      // this._notify(notifyObjs, 'remove', 'hover');
      this._notify(notifyObjs, 'add', 'selection');
    }

    return notifyObjs.length;
  }

  deselect(objects: Object3D[], notify: boolean): number {
    const oldSize = this.selectedObjectMap.size;
    const notifyObjs: Object3D[] = []

    for (const obj of objects) {
      if (!('material' in obj && obj.material instanceof Material)) continue;

      const oldMaterial = this.selectedObjectMap.get(obj.uuid)?.[1];

      if (undefined === oldMaterial) continue;

      obj.material = oldMaterial;
      this.selectedObjectMap.delete(obj.uuid);

      notifyObjs.push(obj);
    }

    if (notify && this.selectedObjectMap.size < oldSize) {
      this._notify(notifyObjs, 'remove', 'selection');
    }

    return notifyObjs.length;
  }

  deselectAll(notify: boolean) {
    const objects: Object3D[] = []

    this.selectedObjectMap.forEach(([selectedObj, mat], uuid) => {
      if (!('material' in selectedObj && selectedObj.material instanceof Material)) return;

      selectedObj.material = this.selectedObjectMap.get(uuid)?.[1];
      this.selectedObjectMap.delete(uuid);

      objects.push(selectedObj);
    });

    if (notify) this._notify(objects, 'remove', 'selection');
  }

  private _unhover(object: Object3D): Material | null {
    if (!('material' in object && object.material instanceof Material)) return null;
    if (object.material === this._selectedMaterial) return null;

    let originalMaterial = this._hoveredObjectMap.get(object.uuid)?.[1];

    if (undefined === originalMaterial) originalMaterial = object.material.clone();
    else this._hoveredObjectMap.delete(object.uuid);

    this._hoveredObjectsSubject.remove(object);

    return originalMaterial;
  }

  private _notify(objects: Object3D[], add: addOrRemove, selection: selectionOrHover) {
    const parents = new Set<Object3D>();

    for (const item of objects) {
      const parent = this._threeUtils.getParentGroup(item);
      if (parent) parents.add(parent);
    }

    if (parents.size === 0) return;

    for (const parent of parents) {
      const subject = selection === 'selection' ? this._selectedObjectsSubject : this._hoveredObjectsSubject;
      const method = add === 'add' ? subject.add.bind(subject) : subject.remove.bind(subject);
      method(parent);
    }

    console.log(selection + ' ' + add + ' ' + parents.size);
  }
}