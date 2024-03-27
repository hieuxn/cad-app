import { CdkDrag, CdkDragHandle, CdkDragMove } from '@angular/cdk/drag-drop';
import { NgClass, NgIf } from '@angular/common';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { Object3D } from 'three';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { SettingsService } from '../../services/settings.service';
import { SidebarService } from '../../services/sidebar.service';
import { DrawingToolbarComponent } from '../drawing-toolbar/drawing-toolbar.component';
import { FamilyCreatorPaneComponent } from '../family-creator-pane/family-pane.component';
import { FileManagementComponent } from '../file-management/file-management.component';
import { LayerManagementComponent } from '../layer-management/layer-management.component';
import { ObjectInformationComponent } from '../object-information/object-information.component';

export type tab = '' | 'layers' | 'geometries' | 'families' | 'info' | 'save';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, CdkDrag, CdkDragHandle, MatIconModule, LayerManagementComponent, DrawingToolbarComponent,
    FileManagementComponent, ObjectInformationComponent, FamilyCreatorPaneComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements AfterViewInit {
  activeTab: tab = ''; // Set default active tab
  isExpanded: boolean = false; // Track whether the sidebar is expanded
  fixedSidebarWidth: number = 50; // Default sidebar width
  sidebarWidth: number = 0; // Default sidebar width
  resizeSidebarWidth: number = 350; // Default sidebar width
  dragHandleMarginleft: number = this.resizeSidebarWidth + this.fixedSidebarWidth;
  selectedObject: Object3D[] = [];
  private _settingsService: SettingsService
  private _subscription = new Subscription();
  private _sidebarService: SidebarService;
  private _selectionService: ObjectSelectionService;

  constructor(private _injector: Injector) {
    this._settingsService = _injector.get(SettingsService);
    this._sidebarService = _injector.get(SidebarService);
    this._selectionService = _injector.get(ObjectSelectionService);
    this._sidebarService.init(this);
  }

  ngAfterViewInit(): void {
    const sub = this._selectionService.observable$.subscribe(item => {
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
    const newSize = Math.max(event.pointerPosition.x - this.fixedSidebarWidth, 200);
    this.sidebarWidth = this.resizeSidebarWidth = newSize;
  }

  selectTab(tab: tab, show: boolean = false): void {
    if (tab !== this.activeTab && !!this.activeTab) {
      this.activeTab = tab;
    } else {
      this.activeTab = tab;
      this.toggleSidebar(show);
    }
  }

  toggleSidebar(show: boolean = false): void {
    this.isExpanded = show || !this.isExpanded;
    this.dragHandleMarginleft = this.resizeSidebarWidth + this.fixedSidebarWidth;
    this.sidebarWidth = this.isExpanded ? this.resizeSidebarWidth : 0;
    if (this.isExpanded) {

    }
    else {
      this.activeTab = '';
    }
  }

  openSettingsDialog() {
    this._settingsService.openSettingsDialog();
  }
}