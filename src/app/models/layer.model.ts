import { Line, Object3D } from 'three';
import { ThreeDService } from '../services/three-d.service';
import { ObjectSnapping } from './object-snapping.model';

export class Layer {
	public id: number;
	public name: string;
	public visible: boolean;
	public elevation: number;
	public active: boolean = false;
	private objects: Object3D[] = [];
	public snapping: ObjectSnapping = new ObjectSnapping();

	constructor(private threeDService: ThreeDService, id: number, name: string, elevation: number, visible: boolean = true) {
		this.id = id;
		this.name = name;
		this.elevation = elevation;
		this.visible = visible;
	}

	public addObjects(...objects: Object3D[]): void {
		for (const item of objects) {
			this.objects.push(item);
			this.threeDService.scene.add(item);
			if (item instanceof Line) {
				this.snapping.insertLine(item);
			}
		}
	}

	public removeLastObjects(...objects: Object3D[]): void {
		this.threeDService.scene.remove(...objects);
		for (const item of objects) {
			if (item instanceof Line) {
				this.snapping.removeLine(item);
			}
		}
		this.objects.length = this.objects.length - objects.length;
	}

	public setVisibility(visible: boolean): void {
		this.visible = visible;
		this.objects.forEach(object => object.visible = visible);
	}
}
