import { DragDropModule } from '@angular/cdk/drag-drop';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ContextMenuComponent } from './core/components/context-menu/context-menu.component';
import { CoordinateDisplayComponent } from './core/components/coordinate-display/coordinate-display.component';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { ViewerComponent } from './core/components/viewer/viewer.component';
import { ObjectControlToolbarModule } from './features/components/object-control-toolbar/object-control-toolbar.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CoordinateDisplayComponent, ViewerComponent, ContextMenuComponent, MatButtonModule, SidebarComponent,
    DragDropModule, MatTableModule, ObjectControlToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent implements AfterViewInit {
  title: string = 'cad-app';
  constructor(private _injector: Injector) {
  }

  ngAfterViewInit(): void {
  }
}
