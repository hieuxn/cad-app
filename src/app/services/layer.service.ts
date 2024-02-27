import { Injectable } from '@angular/core';
import { Layer } from '../models/layer.model';
import { ViewerService } from './viewer.serive';

@Injectable({ providedIn: 'root' })
export class LayerService {
	private layers: Layer[] = [];
	private idCounter: number = 0;
	public activeLayer: Layer | null = null;

	public constructor(private viewerService: ViewerService) {
		this.addLayer('default', 0.0);
		this.layers[0].active = true;
		this.activeLayer = this.layers[0];
	}

	public addLayer(name: string, elevation: number): void {
		const layer = new Layer(this.viewerService, this.idCounter++, name, elevation);
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
			layer.setVisibility(!layer.visible);
		}
	}
}
