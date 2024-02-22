import { Injectable } from '@angular/core';
import { Layer } from '../models/layer.model';

@Injectable({ providedIn: 'root' })
export class LayerService {
	private layers: Layer[] = [];
	private idCounter: number = 0;

	public constructor() { }

	public addLayer(name: string): void {
		const layer = new Layer(this.idCounter++, name);
		this.layers.push(layer);
	}

	public removeLayer(id: number): void {
		this.layers = this.layers.filter(layer => layer.id !== id);
	}

	public getLayers(): Layer[] {
		return this.layers;
	}

	public toggleLayerVisibility(id: number): void {
		const layer = this.layers.find(layer => layer.id === id);
		if (layer) {
			layer.visible = !layer.visible;
		}
	}
}
