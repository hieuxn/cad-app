import { Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { Group, Layers, Line, Mesh, Object3D, Scene } from 'three';
import { CameraChangedEvent, MainView3DService } from '../services/main-view-3d.service';
import { PointSnappingUtils } from '../utils/point-snapping.utils';
import { ThreeUtils } from '../utils/three.utils';
import { ObservableSlim } from './observable-collection.model';

export class ManagedLayer {
	private _layers!: Layers;
	// private _layerService: LayerService;
	private _threeUtils = new ThreeUtils();
	private _objectCollection = new ObservableSlim<Object3D>();
	private _subscription = new Subscription();
	private _scene!: Scene;

	id: number;
	name: string;
	elevation: number;
	active: boolean = false;
	isVisible: boolean = true;
	objects: Map<string, Object3D> = new Map<string, Object3D>();
	objUtils: PointSnappingUtils;
	items$ = this._objectCollection.items$;

	get object3Ds(): Object3D[] {
		return this._scene.children;
	}

	constructor(injector: Injector, id: number, name: string, elevation: number) {
		this.id = id;
		this.name = name;
		this.elevation = elevation;
		const mainViewService = injector.get(MainView3DService);
		this._scene = mainViewService.scene!;
		this._layers = mainViewService.activeCamera.layers;
		mainViewService.onCameraChanged$.subscribe(this._onCameraChanged.bind(this));
		// this._layerService = injector.get(LayerService);
		this.objUtils = new PointSnappingUtils();
	}

	private _onCameraChanged(event: CameraChangedEvent) {
		if (event.isOrthographicCamera) {
			event.camera.layers.enable(this.id);
			event.camera.layers.disable(this.id + 1);
		}
		else {
			event.camera.layers.disable(this.id);
			event.camera.layers.enable(this.id + 1);
		}
	}

	addObjects(objects: Object3D[] | Object3D, useQuadTree: boolean = true): void {
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (this.objects.get(item.uuid)) {
				// throw new Error("Duplicated uuid");
				console.log('already been added')
				return;
			}

			this.setLayer(item, this.id);
			this.objects.set(item.uuid, item);

			this._scene.add(item);
			this._objectCollection.add(item);

			// if (Object.keys(item.userData).length > 0) {
			// 	console.log('add: ' + this._scene.children.filter(c => Object.keys(c.userData).length > 0).map(c => c.uuid))
			// }

			if (useQuadTree) this._addToQuadTree(item);
		}
	}

	setLayer(object: Object3D, id: number) {
		const offset = this._threeUtils.getSetBitPositions(object.layers.mask)[0];
		object.layers.set(id + offset);
		if (object.children.length > 0) {
			object.children.forEach(c => this.setLayer(c, id));
		}
	}

	unsetLayer(object: Object3D) {
		const offset = this._threeUtils.getSetBitPositions(object.layers.mask)[0] - this.id;
		object.layers.set(offset);
		if (object.children.length > 0) {
			object.children.forEach(c => this.unsetLayer(c));
		}
	}

	private _addToQuadTree(objects: Object3D[] | Object3D) {
		// TODO: Improve code
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (item instanceof Group || item instanceof Mesh) {
				this._addToQuadTree(item.children);
			} else if (item instanceof Line) {
				this.objUtils.insertLine(item);
			}
		}
	}

	private _removeFromQuadTree(objects: Object3D[] | Object3D) {
		// TODO: Improve code
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (item instanceof Group || item instanceof Mesh) {
				const clones = item.children;
				this._removeFromQuadTree(clones);
			} else if (item instanceof Line) {
				this.objUtils.removeLine(item);
			}
		}
	}

	removeObjects(objects: Object3D[] | Object3D, useQuadTree: boolean = true): void {
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (!this._scene.getObjectById(item.id)) continue;

			this.unsetLayer(item);

			this._scene.remove(item);
			this._objectCollection.remove(item);

			// if (Object.keys(item.userData).length > 0) {
			// 	console.log('remove: ' + this._scene.children.filter(c => Object.keys(c.userData).length > 0).map(c => c.uuid))
			// }

			this.objects.delete(item.uuid);
			if (useQuadTree) this._removeFromQuadTree(item);
		}
	}

	clear(): void {
		const toRemove: Object3D[] = [];
		this._scene.traverse(obj => {
			if (obj.layers.isEnabled(this.id)) {
				if (obj.layers.mask === 1 << this.id) toRemove.push(obj) // is only on this layer
				else obj.layers.disable(this.id) // on multiple layers
			}
		});

		toRemove.forEach(o => this._objectCollection.remove(o));
		toRemove.forEach(o => this._scene.remove(o));
		
		this.objUtils.clear()
		this.objects.clear();
	}

	toggleVisibility(): void {
		if (this._layers.isEnabled(this.id)) {
			this.isVisible = false;
			this._layers.disable(this.id);
		} else {
			this.isVisible = true;
			this._layers.enable(this.id);
		}
	}
}
