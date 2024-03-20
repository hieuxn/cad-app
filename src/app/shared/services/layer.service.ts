import { Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { Box2, OrthographicCamera, PerspectiveCamera, Vector2, Vector3 } from 'three';
import { ManagedLayer } from '../../core/models/managed-layer.model';
import { ThreeViewLifecycleBase } from '../../core/models/three-view-ready.model';
import { HighLightUtils } from '../../features/components/object-control-toolbar/utils/highlight.utils';
import { ContextMenuCommandBase } from '../commands/context-menu-command-base';
import { ContextMenuGenericCommand } from '../commands/context-menu-generic-command';
import { ContextMenuService } from './context-menu.service';
import { MainView3DService } from './main-view-3d.service';
import { SINGLETON_MOUSE_SERVICE_TOKEN } from './mouse.service';

@Injectable({ providedIn: 'root' })
export class LayerService extends ThreeViewLifecycleBase {
	private _layers: ManagedLayer[] = [];
	private _idCounter: number = 1; // start from 1, odd for 2D, event for 3D
	private _contextMenuService!: ContextMenuService;
	private _contextMenuCommands: ContextMenuCommandBase[] = [];
	private _activeLayerSubject = new Subject<ManagedLayer>();

	activeLayer$ = this._activeLayerSubject.asObservable();
	activeLayer!: ManagedLayer;
	highlightUtils!: HighLightUtils;

	get layers(): ManagedLayer[] {
		return this._layers;
	}

	constructor(injector: Injector) {
		super(injector);
	}

	protected override afterThreeViewReady(afterThreeViewReady: MainView3DService) {
		this.subscription.add(this._activeLayerSubject);

		this._contextMenuService = this.injector.get(ContextMenuService);
		this.highlightUtils = new HighLightUtils(this);
		this._initContextMenuCommands();
	}

	private _initContextMenuCommands() {
		const mouseService = this.injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
		mouseService.mouseContextMenu$.subscribe(this._onMenuContextOpening.bind(this));
		let subscription = mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));

		const snappingCommand = ContextMenuGenericCommand.create('Enable Point Snapping', (event) => {
			snappingCommand.isVisible = false;
			unSnappingCommand.isVisible = true;
			subscription = mouseService.mouseMove$.subscribe(this._onMouseMove.bind(this));
		}, false);

		const unSnappingCommand = ContextMenuGenericCommand.create('Disable Point Snapping', (event) => {
			snappingCommand.isVisible = true;
			unSnappingCommand.isVisible = false;
			subscription.unsubscribe();
		});

		this._contextMenuCommands.push(snappingCommand);
		this._contextMenuCommands.push(unSnappingCommand);
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
		this._contextMenuService.open(event, this._contextMenuCommands);
	}

	setActiveLayer(layerId: number): void {
		this._layers.forEach(layer => layer.active = false);
		const activeLayer = this._layers.find(layer => layer.id === layerId);
		if (activeLayer) {
			activeLayer.active = true;
			this.activeLayer = activeLayer;
			this._activeLayerSubject.next(activeLayer);
		}
	}

	addLayer(name: string, elevation: number): void {
		this.mainView3DService.activeCamera.layers.enable(this._idCounter);
		const layer = new ManagedLayer(this.injector, this._idCounter, name, elevation);
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
		mouse.x = (event.clientX / this.mainView3DService.renderer.domElement.clientWidth) * 2 - 1;
		mouse.y = -(event.clientY / this.mainView3DService.renderer.domElement.clientHeight) * 2 + 1;
		return mouse;
	}

	convertMouseEventToWorldSpace(event: MouseEvent): Vector3 {
		const mouseNDC = this.getMouseNDC(event);
		const z = this.activeLayer?.elevation ?? 0;
		let activeCamera = this.mainView3DService.activeCamera;

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
