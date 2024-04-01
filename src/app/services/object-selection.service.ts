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
      if (false == this._hover(mousePosition)) this._unhover();
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

    sub = this._mouseService.mouseDown$.subscribe(this._onSelectionBoxDraw.bind(this));
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

  private _onSelectionBoxDraw(event: MouseEvent) {
    if (event.button !== 0) {
      this._isLeftCicked = false;
      return;
    }

    for (const item of this._selectionBox.collection) {
      this.deselect(item);
    }

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

      for (const item of this._selectionBox.collection) {
        this.deselect(item);
      }

      const mouse = this._layerService.getMouseNDC(event);
      this._selectionBox.endPoint.set(mouse.x, mouse.y, 0.5);

      const allSelected = this._selectionBox.select();
      for (const item of allSelected) {
        if (!item.layers.isEnabled(activeId + this._idOffset)) continue;
        this.select(item);
      }
    }
  }

  private _onSelectionBoxFinish(event: MouseEvent) {
    if (event.button !== 0) return;
    const activeId = this._layerService.activeLayer.id;
    const mouse = this._layerService.getMouseNDC(event);
    this._selectionBox.endPoint.set(mouse.x, mouse.y, 0.5);

    const allSelected = this._selectionBox.select();
    for (const item of allSelected) {
      if (!item.layers.isEnabled(activeId + this._idOffset)) continue;
      this.select(item);
    }
  }

  private _hover(mouseNDC: Vector2): boolean {
    if (this._selectionHelper.isDown) return false;
    const activeId = this._layerService.activeLayer.id;

    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);

    let resetHover = true;
    for (const intersection of intersections) {
      const parent = this._threeUtils.getParentGroup(intersection.object);
      if (!parent) continue;
      // if (!obj.layers.isEnabled(activeId + this._idOffset)) continue;
      for (const obj of this._flatChildren(parent)) {
        if ('material' in obj
          && obj.material instanceof Material
          && obj.material !== this._hoveredMaterial
          && obj.material !== this._selectedMaterial
          && undefined === this._hoveredObjectMap.get(obj.uuid)) {

          if (resetHover) {
            resetHover = false;
            this._unhover();
          }

          const originalMaterial = this.selectedObjectMap.get(obj.uuid)?.[1] || obj.material.clone();
          // this._hoveredObjectMap.set(obj.uuid, [obj, originalMaterial]);
          this._addToHover(obj, originalMaterial)
          obj.material = this._hoveredMaterial;
          // console.log('hover');
        }
      }
      return true;
    }

    return intersections.length > 0;
  }

  private _unhover() {
    for (const [key, [obj, material]] of this._hoveredObjectMap) {
      if ('material' in obj && obj.material instanceof Material) {
        obj.material = material;
      }
      this._removeFromHover(obj);
    }
    // this._hoveredObjectMap.clear();
  }

  private _handleSelection(mouseNDC: THREE.Vector2, multiSelect: boolean): void {
    // if (this._selectionHelper.isDown) return;
    const activeId = this._layerService.activeLayer.id;

    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);

    if (intersections.length > 0) {
      const parent = this._threeUtils.getParentGroup(intersections[0].object); // Select the first intersected object
      if (!parent) return;

      let deselectAll = true;
      for (const obj of this._flatChildren(parent)) {
        if (multiSelect) {
          if (this.selectedObjectMap.has(obj.uuid)) this.deselect(obj)
          else this.select(obj);
        }
        else if (this.selectedObjectMap.has(obj.uuid)) this.deselect(obj)
        else {
          if (deselectAll) {
            deselectAll = false;
            this._unhover();
            this.deselectAll();
            // console.log('select');
          }
          this.select(obj);
        }
      }
    }
    else this.deselectAll();
  }

  private _flatChildren(object: Object3D): Object3D[] {
    return object.children.flatMap(c => this._flatChildren(c).concat(c));
  }

  select(obj: Object3D) {
    const originalMaterial = this._removeFromHover(obj);
    if (!originalMaterial) return;
    this._addToSelection(obj, originalMaterial);
    (obj as any).material = this._selectedMaterial;
  }

  deselect(obj: Object3D) {
    if (!('material' in obj && obj.material instanceof Material)) return;
    const oldMaterial = this.selectedObjectMap.get(obj.uuid)?.[1];
    if (undefined === oldMaterial) return;
    obj.material = oldMaterial;
    this.selectedObjectMap.delete(obj.uuid);
  }

  deselectAll() {
    // console.log('deselectAll');
    this.selectedObjectMap.forEach(([selectedObj, mat], uuid) => {
      if (!('material' in selectedObj && selectedObj.material instanceof Material)) return;
      selectedObj.material = this.selectedObjectMap.get(uuid)?.[1];
      this.selectedObjectMap.delete(uuid);
    });
  }

  private _addToSelection(object: Object3D, material: Material) {
    this.selectedObjectMap.set(object.uuid, [object, material]);
    this._selectedObjectsSubject.add(object);
  }

  private _addToHover(object: Object3D, material: Material) {
    this._hoveredObjectMap.set(object.uuid, [object, material]);
    this._hoveredObjectsSubject.add(object);
  }

  private _removeFromHover(object: Object3D): Material | null {
    if (!('material' in object && object.material instanceof Material)) return null;
    if (object.material === this._selectedMaterial) return null;
    let originalMaterial = this._hoveredObjectMap.get(object.uuid)?.[1];
    if (undefined === originalMaterial) originalMaterial = object.material.clone();
    else this._hoveredObjectMap.delete(object.uuid);

    this._hoveredObjectsSubject.remove(object);
    return originalMaterial;
  }
}