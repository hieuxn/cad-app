import { Injectable } from '@angular/core';
import { ManagedLayer } from '../models/layer.model';
import { ViewerService } from './viewer.serive';

@Injectable({ providedIn: 'root' })
export class LayerService {
	private _layers: ManagedLayer[] = [];
	private idCounter: number = 1;
	public activeLayer: ManagedLayer | null = null;

	public get layers(): ManagedLayer[] {
		return this._layers;
	}

	public constructor(private viewerService: ViewerService) {
	}

	public setActiveLayer(layerId: number): void {
		this._layers.forEach(layer => layer.active = false);
		const activeLayer = this._layers.find(layer => layer.id === layerId);
		if (activeLayer) {
			activeLayer.active = true;
			this.activeLayer = activeLayer;
		}
	}

	public addLayer(name: string, elevation: number): void {
		this.viewerService.view3D.activeCamera.layers.enable(this.idCounter);
		const layer = new ManagedLayer(this.viewerService, this.idCounter++, name, elevation);
		this._layers.push(layer);
	}

	public removeLayer(id: number): void {
		this._layers = this._layers.filter(layer => layer.id !== id);
	}

	public toggleLayerVisibility(id: number): void {
		const layer = this._layers.find(layer => layer.id === id);
		if (layer) {
			layer.toggleVisibility();
		}
	}
}
