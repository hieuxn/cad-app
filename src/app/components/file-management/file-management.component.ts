import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { VectorFileConveterService } from '../../services/vector-file-converter/vector-file-converter.service';
import { ViewerService } from '../../services/viewer.serive';

@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './file-management.component.html',
  styleUrl: './file-management.component.scss'
})
export class FileManagementComponent {
  constructor(private converterService: VectorFileConveterService,
    private snackBar: MatSnackBar,
    private viewerService: ViewerService) {

  }

  public async handleFileInput(event: Event) {
    try {
      const result = await this.converterService.handleFileInput(event);
      if (null === result) return;
      this.viewerService.view3D.scene.add(...result);
    }
    catch (error) {
      if (!(error instanceof Error)) return;
      this.snackBar.open(error.message, 'Close', { duration: 3000 });
      return;
    }
  }

  public async export() {
    const objects = this.viewerService.view3D.scene.children.slice(2);
    const file = await this.converterService.exportToFile(objects, 'dxf');
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
