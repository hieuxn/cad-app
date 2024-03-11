import { CdkDrag, CdkDragHandle, CdkDragMove } from '@angular/cdk/drag-drop';
import { NgClass, NgIf } from '@angular/common';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { Object3D } from 'three';
import { LayerService } from '../../services/layer.service';
import { SaveComponent } from '../save/save.component';
import { DrawingToolbarComponent } from './drawing-toolbar/drawing-toolbar.component';
import { FileManagementComponent } from './file-management/file-management.component';
import { LayerManagementComponent } from './layer-management/layer-management.component';
import { ObjectInformationComponent } from './object-information/object-information.component';
import { SettingsDialogComponent } from './settings-dialog/settings-dialog.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, CdkDrag, CdkDragHandle, MatIconModule, LayerManagementComponent, DrawingToolbarComponent,
    FileManagementComponent, SaveComponent, ObjectInformationComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements AfterViewInit {
  activeTab: string = ''; // Set default active tab
  isExpanded: boolean = false; // Track whether the sidebar is expanded
  fixedSidebarWidth: number = 50; // Default sidebar width
  sidebarWidth: number = 0; // Default sidebar width
  resizeSidebarWidth: number = 350; // Default sidebar width
  dragHandleMarginleft: number = this.resizeSidebarWidth + this.fixedSidebarWidth;
  selectedObject: Object3D[] = [];
  private _dialog: MatDialog
  private _subscription = new Subscription();

  constructor(private _injector: Injector) {
    this._dialog = _injector.get(MatDialog);
  }

  ngAfterViewInit(): void {
    const sub = this._injector.get(LayerService).activeLayer.objUtils.observable$.subscribe(item => {
      this.selectedObject = [item];
    });
    this._subscription.add(sub);
    // this.selectTab('layers');
  }

  onResize(event: CdkDragMove<any>) {
    if (!this.isExpanded) {
      this.sidebarWidth = 0;
      return;
    }
    this.sidebarWidth = this.resizeSidebarWidth = event.pointerPosition.x - this.fixedSidebarWidth;
  }

  selectTab(tab: string): void {
    if (tab !== this.activeTab && !!this.activeTab) {
      this.activeTab = tab;
    } else {
      this.activeTab = tab;
      this.toggleSidebar();
    }
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
    this.dragHandleMarginleft = this.resizeSidebarWidth + this.fixedSidebarWidth;
    this.sidebarWidth = this.isExpanded ? this.resizeSidebarWidth : 0;
    if (this.isExpanded) {

    }
    else {
      this.activeTab = '';
    }
  }

  openSettingsDialog() {
    const dialogRef = this._dialog.open(SettingsDialogComponent, {
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