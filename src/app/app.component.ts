import { DragDropModule } from '@angular/cdk/drag-drop';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { CommandManagerComponent } from './components/command-manager/command-manager.component';
import { ContextMenuComponent } from './components/context-menu/context-menu.component';
import { CoordinateDisplayComponent } from './components/coordinate-display/coordinate-display.component';
import { ObjectControlToolbarComponent } from './components/object-control-toolbar/object-control-toolbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ViewerComponent } from './components/viewer/viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CoordinateDisplayComponent, ViewerComponent, ContextMenuComponent, MatButtonModule, SidebarComponent,
    DragDropModule, MatTableModule, ObjectControlToolbarComponent, CommandManagerComponent],
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
