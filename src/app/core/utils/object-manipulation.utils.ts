import { Injector } from "@angular/core";
import { Subject, Subscription } from "rxjs";
import THREE, { Material, MeshStandardMaterial, Object3D, OrthographicCamera, PerspectiveCamera, Raycaster, Vector2 } from "three";
import { LayerService } from "../../shared/services/layer.service";
import { MainView3DService } from "../../shared/services/main-view-3d.service";
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from "../../shared/services/mouse.service";
import { ObjectSnapping } from "./object-snapping.utils";

export class ObjectManipulation extends ObjectSnapping {
  selectedObjects: Map<string, [Object3D, Material]> = new Map<string, [Object3D, Material]>();
  private _subject = new Subject<Object3D>();
  observable$ = this._subject.asObservable();
  private _hoveredObjects: Map<string, [Object3D, Material]> = new Map<string, [Object3D, Material]>();
  private _selectionWidth: number = 0.3; //m
  private _highlightMaterial: MeshStandardMaterial;
  private _mainViewService: MainView3DService;
  private _layerService: LayerService;
  private _mouseService: MouseService;
  private _raycaster: Raycaster = new Raycaster();
  private _subscription = new Subscription();

  constructor(injector: Injector) {
    super();
    this._mainViewService = injector.get(MainView3DService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._layerService = injector.get(LayerService);
    let sub = this._mouseService.mouseMove$.subscribe(event => {
      const mousePosition = this._layerService.getMouseNDC(event);
      if (false == this._hover(mousePosition)) this._unhover();
    });
    this._subscription.add(sub);

    sub = this._mouseService.wheel$.subscribe(event => {
      const camera = this._mainViewService.activeCamera as OrthographicCamera | PerspectiveCamera;
      const zoom = Math.min(1, camera.zoom);
      this._raycaster.params.Line.threshold = 0.2 / zoom * zoom;
    });
    this._subscription.add(sub);

    sub = this._mouseService.mouseDown$.subscribe(event => {
      if (event.button !== 0) return;
      const mousePosition = this._layerService.getMouseNDC(event);
      this._select(mousePosition, event.ctrlKey);
    })
    this._subscription.add(sub);

    this._highlightMaterial = new MeshStandardMaterial({ depthTest: false, depthWrite: false, emissive: 0x00FF00, emissiveIntensity: 0.8 });
    this._highlightMaterial.color.setHex(0x00FF00);
    // this._material.color.convertSRGBToLinear();
    this._raycaster.params.Line.threshold = 0.2;
  }

  dispose() {
    this._subscription.unsubscribe();
  }

  private _hover(mouseNDC: Vector2): boolean {
    const activeId = this._layerService.activeLayer.id;
    this._raycaster.layers.set(activeId);

    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);

    for (const intersection of intersections) {
      const obj = intersection.object;
      if (!obj.layers.isEnabled(activeId)) continue;
      if ('material' in obj
        && obj.material instanceof Material
        && obj.material !== this._highlightMaterial
        && undefined === this._hoveredObjects.get(obj.uuid)) {

        this._hoveredObjects.set(obj.uuid, [obj, obj.material.clone()]);
        obj.material = this._highlightMaterial;
        return this._hoveredObjects.size < 2;
      }
    }

    return intersections.length > 0;
  }

  private _unhover() {
    for (const [key, [obj, material]] of this._hoveredObjects) {
      if ('material' in obj && obj.material instanceof Material) {
        obj.material = material;
      }
    }
    this._hoveredObjects.clear();
  }

  private _select(mouseNDC: THREE.Vector2, multiSelect: boolean): void {
    const activeId = this._layerService.activeLayer.id;
    this._raycaster.layers.set(activeId);

    const camera = this._mainViewService.activeCamera;
    this._raycaster.setFromCamera(mouseNDC, camera)

    const objs = this._layerService.activeLayer.object3Ds;
    const intersections = this._raycaster.intersectObjects(objs, true);

    if (intersections.length > 0) {
      const obj = intersections[0].object; // Select the first intersected object
      if (!obj.layers.isEnabled(activeId)) return;
      if (!('material' in obj && obj.material instanceof Material)) return;
      if (multiSelect) {
        if (this.selectedObjects.has(obj.uuid)) {
          obj.material = this.selectedObjects.get(obj.uuid)?.[1]; // Deselect: revert to original material
          this.selectedObjects.delete(obj.uuid);
        } else {
          // get old material
          let material = this._hoveredObjects.get(obj.uuid)?.[1];
          if (undefined === material) material = obj.material.clone();
          else this._hoveredObjects.delete(obj.uuid);

          // this._selectedObjects.set(obj.uuid, [obj, material]);
          this._add(obj, material);
          obj.material = this._highlightMaterial; // Assign selected material
        }
        return;
      }

      // Single-selection
      if (!this.selectedObjects.has(obj.uuid)) {
        // Deselect others if not multi-select
        this.selectedObjects.forEach(([selectedObj, mat], uuid) => {
          if (!('material' in selectedObj && selectedObj.material instanceof Material)) return;
          selectedObj.material = this.selectedObjects.get(uuid)?.[1];
          this.selectedObjects.delete(uuid);
        });

        // get old material
        let material = this._hoveredObjects.get(obj.uuid)?.[1];
        if (undefined === material) material = obj.material.clone();
        else this._hoveredObjects.delete(obj.uuid);

        // this._selectedObjects.set(obj.uuid, [obj, material]);
        this._add(obj, material);
        obj.material = this._highlightMaterial;
      } else {
        // Deselect if select again
        obj.material = this.selectedObjects.get(obj.uuid)?.[1];
        this.selectedObjects.delete(obj.uuid);
      }

      return;
    }

    // Deselect all
    this.deSelectAll();
    this.selectedObjects.clear();
  }

  deSelectAll() {
    this.selectedObjects.forEach(([selectedObj, mat], uuid) => {
      if (!('material' in selectedObj && selectedObj.material instanceof Material)) return;
      selectedObj.material = this.selectedObjects.get(uuid)?.[1];
      this.selectedObjects.delete(uuid);
    });
  }

  private _add(object: Object3D, material: Material) {
    this.selectedObjects.set(object.uuid, [object, material]);
    this._subject.next(object);
  }
}