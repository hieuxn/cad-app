import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { CoordinateDisplayComponent } from './components/coordinate-display/coordinate-display.component';
import { DrawingToolbarComponent } from './components/drawing-toolbar/drawing-toolbar.component';
import { LayerManagementComponent } from './components/layer-management/layer-management.component';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { ContextMenuService } from './services/context-menu.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CoordinateDisplayComponent, ViewerComponent, LayerManagementComponent, DrawingToolbarComponent, ContextMenuComponent, MatButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  public title: string = 'cad-app';
  @ViewChild('contextMenu') contextMenu!: ContextMenuComponent;

  constructor(
    private contextMenuService: ContextMenuService,
    private dialog: MatDialog) {
  }

  public ngAfterViewInit(): void {
    this.contextMenuService.inject(this.contextMenu);
  }

  openSettingsDialog(): void {
    const dialogRef = this.dialog.open(SettingsDialogComponent, {
      width: '400px',
      height: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The settings dialog was closed', result);
      // Optional: handle the result, apply settings, etc.
    });
  }
}
