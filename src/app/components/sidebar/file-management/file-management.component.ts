import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LayerService } from '../../../services/layer.service';
import { MainView3DService } from '../../../services/main-view-3d.service';
import { VectorFileConveterService } from '../../../services/vector-file-converter/vector-file-converter.service';

@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './file-management.component.html',
  styleUrl: './file-management.component.scss'
})
export class FileManagementComponent {
  private _converterService: VectorFileConveterService;
  private _snackBar: MatSnackBar;
  private _mainViewService: MainView3DService;
  private _layerService: LayerService;

  constructor(injector: Injector) {
    this._converterService = injector.get(VectorFileConveterService);
    this._snackBar = injector.get(MatSnackBar);
    this._mainViewService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
  }

  async handleFileInput(event: Event) {
    try {
      const result = await this._converterService.handleFileInput(event);
      if (null === result) return;
      this._layerService.activeLayer.addObjects(result);
    }
    catch (error) {
      if (!(error instanceof Error)) return;
      this._snackBar.open(error.message, 'Close', { duration: 3000 });
      return;
    }
  }

  async export() {
    // TODO: get necessary objects to export
    const objects = this._mainViewService.object3Ds.slice(1);
    const file = await this._converterService.exportToFile(objects, 'dxf');
    if (null === file) return;
    const blob = new Blob([await file.text()], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.dxf';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
