import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { DrawingToolbarComponent } from './components/drawing-toolbar/drawing-toolbar.component';
import { LayerManagementComponent } from './components/layer-management/layer-management.component';
import { ViewerComponent } from './components/viewer/viewer.component';
import { ContextMenuService } from './services/context-menu.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ViewerComponent, LayerManagementComponent, DrawingToolbarComponent, ContextMenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  public title: string = 'cad-app';
  @ViewChild('contextMenu') contextMenu!: ContextMenuComponent;

  constructor(
    private contextMenuService: ContextMenuService
  ) {
    // Object3D.DEFAULT_UP = new Vector3(0, 0, 1);
  }

  public ngAfterViewInit(): void {
    this.contextMenuService.inject(this.contextMenu);
  }
}
