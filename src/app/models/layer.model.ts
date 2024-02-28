import { Layers, Line, Object3D } from 'three';
import { ViewerService } from '../services/viewer.serive';
import { ObjectSnapping } from './object-snapping.model';

export class ManagedLayer {
	public id: number;
	public name: string;
	public elevation: number;
	public active: boolean = false;
	public visible: boolean = true;
	public snapping: ObjectSnapping = new ObjectSnapping();
	private objects: Map<string, Object3D> = new Map<string, Object3D>();
	private layers!: Layers;

	constructor(private viewerService: ViewerService, id: number, name: string, elevation: number) {
		this.id = id;
		this.name = name;
		this.elevation = elevation;
		this.layers = viewerService.view3D.activeCamera.layers;
	}

	public addObjects(...objects: Object3D[]): void {
		for (const item of objects) {
			item.layers.set(this.id);
			if (this.objects.get(item.uuid)) throw new Error("Duplicated uuid");
			this.objects.set(item.uuid, item);
			this.viewerService.view3D.scene.add(item);

			// TODO: Improve code
			if (item instanceof Line) {
				this.snapping.insertLine(item);
			}
		}
	}

	public removeObjects(...objects: Object3D[]): void {
		this.viewerService.view3D.scene.remove(...objects);
		for (const item of objects) {
			// TODO: improve code
			if (item instanceof Line) {
				this.snapping.removeLine(item);
			}
			this.objects.delete(item.uuid);
		}
	}

	public toggleVisibility(): void {
		if (this.layers.isEnabled(this.id)) {
			this.visible = false;
			this.layers.disable(this.id);
		} else {
			this.visible = true;
			this.layers.enable(this.id);
		}
	}
}
