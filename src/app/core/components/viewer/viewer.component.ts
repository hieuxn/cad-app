import { AfterViewInit, Component, HostListener, Injector, OnInit, ViewChild } from '@angular/core';
import { TitleSpacingPipe } from '../../../shared/pipes/title-spacing/title-spacing.pipe';
import { MainView3DService } from '../../../shared/services/main-view-3d.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../../shared/services/mouse.service';
import { ViewSyncUtils } from '../../../shared/utils/viewer.utils';
import { ViewNavigatorComponent } from './view-navigator/view-navigator.component';
import { ViewThreeDComponent } from './view-three-d/view-three-d.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [ViewThreeDComponent, ViewNavigatorComponent, TitleSpacingPipe],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('viewNavigator') private _viewNavigator!: ViewNavigatorComponent;
  private _viewSyncUtils: ViewSyncUtils
  private _mainView3DService: MainView3DService;
  private _mouseService: MouseService;

  constructor(injector: Injector) {
    this._mainView3DService = injector.get(MainView3DService);
    this._mouseService = injector.get(SINGLETON_MOUSE_SERVICE_TOKEN);
    this._viewSyncUtils = new ViewSyncUtils()
  }

  ngAfterViewInit(): void {
    this._viewSyncUtils.sync(this._mainView3DService, this._viewNavigator);
  }

  ngOnInit(): void {
  }

  @HostListener('mousedown', ['$event'])
  mouseDown(event: MouseEvent): void {
    this._mouseService.mouseDownInvoke(event);
  }

  @HostListener('mouseup', ['$event'])
  mouseUp(event: MouseEvent): void {
    this._mouseService.mouseUpInvoke(event);
  }

  @HostListener('mousemove', ['$event'])
  mouseMove(event: MouseEvent): void {
    this._mouseService.mouseMoveInvoke(event);
  }

  @HostListener('document:contextmenu', ['$event'])
  mouseContextMenu(event: MouseEvent): void {
    this._mouseService.mouseContextMenuInvoke(event);
  }

  @HostListener('wheel', ['$event'])
  wheel(event: MouseEvent): void {
    this._mouseService.wheel(event);
  }
}
