import { Injector } from '@angular/core';
import { Group, Layers, Line, LineLoop, Mesh, Object3D, Scene } from 'three';
import { ObjectSnappingUtils } from '../../features/components/object-control-toolbar/utils/object-snapping.utils';
import { LayerService } from '../../shared/services/layer.service';
import { CameraChangedEvent, MainView3DService } from '../../shared/services/main-view-3d.service';

export class ManagedLayer {
	id: number;
	name: string;
	elevation: number;
	active: boolean = false;
	isVisible: boolean = true;

	objects: Map<string, Object3D> = new Map<string, Object3D>();
	objUtils: ObjectSnappingUtils;
	private _layers!: Layers;
	private _layerService: LayerService;
	private _scene: Scene;
	private _is3DObjectMap: Map<string, boolean> = new Map<string, boolean>([
		[Line.name, false],
		[LineLoop.name, false],
		[Group.name, false],
		[Mesh.name, true],
	])

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
		this._layerService = injector.get(LayerService);
		this.objUtils = new ObjectSnappingUtils();
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
			this._setLayer(item, this.id);
			if (this.objects.get(item.uuid)) throw new Error("Duplicated uuid");
			this.objects.set(item.uuid, item);
			this._scene.add(item);
			if (useQuadTree) this._addToQuadTree(item);
		}
	}

	private _setLayer(object: Object3D, id: number) {
		const offset = (this._is3DObjectMap.get(object.type) || false) ? 1 : 0;
		object.layers.set(id + offset);
		if (object.children.length > 0) {
			object.children.forEach(c => this._setLayer(c, id));
		}
	}

	private _addToQuadTree(objects: Object3D[] | Object3D) {
		// TODO: Improve code
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (item instanceof Group) {
				const clones = item.children;//.map(c => {
				// 	const child = c.clone();
				// 	child.position.copy(item.position);
				// 	child.scale.copy(item.scale);
				// 	child.rotation.copy(item.rotation);
				// 	return child;
				// })
				this._addToQuadTree(clones);
			} else if (item instanceof Line) {
				this.objUtils.insertLine(item);
			}
		}
	}

	private _removeFromQuadTree(objects: Object3D[] | Object3D) {
		// TODO: Improve code
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			if (item instanceof Group) {
				const clones = item.children;//.map(c => {
				// 	const child = c.clone();
				// 	child.position.copy(item.position);
				// 	child.scale.copy(item.scale);
				// 	child.rotation.copy(item.rotation);
				// 	return child;
				// })
				this._removeFromQuadTree(clones);
			} else if (item instanceof Line) {
				this.objUtils.removeLine(item);
			}
		}
	}

	removeObjects(objects: Object3D[] | Object3D, useQuadTree: boolean = true): void {
		objects = objects instanceof Array ? objects : [objects]
		for (const item of objects) {
			this._scene.remove(item);
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

		this._scene.remove(...toRemove);
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
