import { Injectable, Injector } from '@angular/core';
import { Box2, Object3D, OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3 } from 'three';
import { ContextMenuCommandBase } from '../components/context-menu/commands/context-menu-command-base';
import { ContextMenuGenericCommand } from '../components/context-menu/commands/context-menu-generic-command';
import { ManagedLayer } from '../models/managed-layer.model';
import { HighLightUtils } from '../utils/highlight.utils';
import { ContextMenuService } from './context-menu.service';
import { FamilyCreatorService } from './family-creator/family-creator.service';
import { MainView3DService } from './main-view-3d.service';
import { SINGLETON_MOUSE_SERVICE_TOKEN } from './mouse.service';

@Injectable({ providedIn: 'root' })
export class LayerService {
	activeLayer!: ManagedLayer;
	highlightUtils: HighLightUtils;

	private _layers: ManagedLayer[] = [];
	private _idCounter: number = 1; // start from 1, odd for 2D, event for 3D
	private _mainViewService: MainView3DService;
	private _contextMenuService: ContextMenuService;
	private _contextMenuCommands: ContextMenuCommandBase[] = [];
	private _familyCreatorService: FamilyCreatorService;

	get layers(): ManagedLayer[] {
		return this._layers;
	}

	constructor(private _injector: Injector) {
		this._mainViewService = _injector.get(MainView3DService);
		this._contextMenuService = _injector.get(ContextMenuService);
		this.highlightUtils = new HighLightUtils(this);
		this._familyCreatorService = _injector.get(FamilyCreatorService);
		this._initContextMenuCommands();
	}

	private _initContextMenuCommands() {
		const mouseService = this._injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
		mouseService.mouseContextMenu$.subscribe(this._onMenuContextOpening.bind(this));
		let subscription = mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));

		const snappingCommand = ContextMenuGenericCommand.Create('Enable Point Snapping', (event) => {
			snappingCommand.isVisible = false;
			unSnappingCommand.isVisible = true;
			subscription = mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));
		}, false);

		const unSnappingCommand = ContextMenuGenericCommand.Create('Disable Point Snapping', (event) => {
			snappingCommand.isVisible = true;
			unSnappingCommand.isVisible = false;
			subscription.unsubscribe();
		});

		const deleteCommand = ContextMenuGenericCommand.Create('Delete', (event) => {
			if (this.activeLayer.objUtils.selectedObjects.size === 0) return;
			for (const [obj, material] of this.activeLayer!.objUtils.selectedObjects.values()) {
				let parent = obj;
				while (parent.parent && !(parent.parent instanceof Scene)) {
					parent = parent.parent;
				}
				this.activeLayer.removeObjects(parent);
			}
		}, false);

		const createFamilyCommand = ContextMenuGenericCommand.Create('Create Family', (event) => {
			if (this.activeLayer.objUtils.selectedObjects.size === 0) return;
			const group: Object3D[] = [];
			for (const [obj, _] of this.activeLayer!.objUtils.selectedObjects.values()) {
				group.push(obj);
			}

			this.activeLayer!.objUtils.deSelectAll();
			this._familyCreatorService.openFamilyCreatorDialog(group);
		}, false);

		this._contextMenuCommands.push(snappingCommand);
		this._contextMenuCommands.push(unSnappingCommand);
		this._contextMenuCommands.push(deleteCommand);
		this._contextMenuCommands.push(createFamilyCommand);
	}

	private _onMouseMove(event: MouseEvent) {
		const halfWidth = 0.3; //m
		const elevation = this.activeLayer!.elevation;
		const snappingUtils = this.activeLayer!.objUtils;
		const mouseLocation = this.convertMouseEventToWorldSpace(event);
		const box = new Box2(
			new Vector2(mouseLocation.x - halfWidth, mouseLocation.y - halfWidth),
			new Vector2(mouseLocation.x + halfWidth, mouseLocation.y + halfWidth));
		const points = snappingUtils.query(box)

		this.highlightUtils.clearHighlight();

		// highlight near points
		for (const point of points) {
			// const point3d = new Vector3(point.x, point.y, elevation);
			this.highlightUtils.highlightPoint(point, elevation);
		}
	}

	private _onMenuContextOpening(event: MouseEvent) {
		const deleteCommand = this._contextMenuCommands[2];
		const createFamilyCommand = this._contextMenuCommands[3];

		deleteCommand.isVisible = createFamilyCommand.isVisible = this.activeLayer!.objUtils.selectedObjects.size > 0;
		this._contextMenuService.open(event, this._contextMenuCommands);
	}

	setActiveLayer(layerId: number): void {
		this._layers.forEach(layer => layer.active = false);
		const activeLayer = this._layers.find(layer => layer.id === layerId);
		if (activeLayer) {
			activeLayer.active = true;
			this.activeLayer = activeLayer;
		}
	}

	addLayer(name: string, elevation: number): void {
		this._mainViewService.activeCamera.layers.enable(this._idCounter);
		const layer = new ManagedLayer(this._injector, this._idCounter, name, elevation);
		this._layers.push(layer);
		this._idCounter += 2;
	}

	removeLayer(id: number): void {
		this._layers = this._layers.filter(layer => layer.id !== id);
	}

	toggleLayerVisibility(id: number): void {
		const layer = this._layers.find(layer => layer.id === id);
		if (layer) {
			layer.toggleVisibility();
		}
	}

	getMouseNDC(event: MouseEvent): Vector2 {
		const mouse = new Vector2();
		mouse.x = (event.clientX / this._mainViewService.renderer.domElement.clientWidth) * 2 - 1;
		mouse.y = -(event.clientY / this._mainViewService.renderer.domElement.clientHeight) * 2 + 1;
		return mouse;
	}

	convertMouseEventToWorldSpace(event: MouseEvent): Vector3 {
		const mouseNDC = this.getMouseNDC(event);
		const z = this.activeLayer?.elevation ?? 0;
		let activeCamera = this._mainViewService.activeCamera;

		if (activeCamera instanceof OrthographicCamera) {
			const tempZ = (activeCamera.near + activeCamera.far) / (activeCamera.near - activeCamera.far);
			const pos = new Vector3(mouseNDC.x, mouseNDC.y, tempZ);
			pos.applyMatrix4(activeCamera.projectionMatrixInverse).add(activeCamera.position);
			pos.z = z;
			return pos;
		}
		else if (activeCamera instanceof PerspectiveCamera) {
			const tempPos = new Vector3(mouseNDC.x, mouseNDC.y, 0.5);
			tempPos.unproject(activeCamera);
			tempPos.sub(activeCamera.position).normalize();
			var distance = - activeCamera.position.z / tempPos.z;
			const position = new Vector3().copy(activeCamera.position).add(tempPos.multiplyScalar(distance))
			position.z = z;
			return position;
		}

		return new Vector3();
	}
}
