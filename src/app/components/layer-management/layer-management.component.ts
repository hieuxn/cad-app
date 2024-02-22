import { NgFor } from '@angular/common';
import { Component, Injectable, OnInit } from '@angular/core';
import { Layer } from '../../models/layer.model';
import { LayerService } from '../../services/layer.service';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-layer-management',
  standalone: true,
  imports: [NgFor],
  templateUrl: './layer-management.component.html',
  styleUrls: ['./layer-management.component.scss']
})
export class LayerManagementComponent implements OnInit {
  public layers: Layer[] = [];

  public constructor(private layerService: LayerService) { }

  public ngOnInit(): void {
    this.refreshLayers();
  }

  public addLayer(name: string): void {
    this.layerService.addLayer(name);
    this.refreshLayers();
  }

  public toggleLayerVisibility(id: number): void {
    this.layerService.toggleLayerVisibility(id);
    this.refreshLayers();
  }

  private refreshLayers(): void {
    this.layers = this.layerService.getLayers();
  }
}
