import { NgFor } from '@angular/common';
import { AfterContentInit, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LayerService } from '../../../../shared/services/layer.service';
import { ManagedLayer } from '../../../models/managed-layer.model';

@Component({
  selector: 'app-layer-management',
  standalone: true,
  imports: [NgFor, MatButtonModule],
  templateUrl: './layer-management.component.html',
  styleUrls: ['./layer-management.component.scss']
})
export class LayerManagementComponent implements AfterContentInit {
  layers: ManagedLayer[] = [];

  constructor(private layerService: LayerService, private snackBar: MatSnackBar) {
    this.layers = layerService.layers;
  }
  ngAfterContentInit(): void {
    this.layerService.addLayer('default', 0.0);
    this.setActiveLayer(1);
  }

  ngOnInit(): void {
  }

  addLayer(name: string, elevation: string): void {
    if (!name || !elevation) {
      this.snackBar.open('The name or elevation field is empty', 'Close', { duration: 3000 });
      return;
    }
    if (this.layers.find(layer => layer.elevation == +elevation)) {
      this.snackBar.open('Each layer must have a unique elevation', 'Close', { duration: 3000 });
      return;
    }
    this.layerService.addLayer(name, +elevation);
  }

  toggleLayerVisibility(id: number): void {
    this.layerService.toggleLayerVisibility(id);
  }

  setActiveLayer(layerId: number): void {
    this.layerService.setActiveLayer(layerId);
  }
}
