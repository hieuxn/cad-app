import { AfterViewInit, Component, HostListener, Inject, Injectable, OnInit, ViewChild } from '@angular/core';
import { TitleSpacingPipe } from '../../pipes/title-spacing/title-spacing.pipe';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../services/mouse.service';
import { ViewerService } from '../../services/viewer.serive';
import { ViewNavigatorComponent } from './view-navigator/view-navigator.component';
import { ViewThreeDComponent } from './view-three-d/view-three-d.component';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [ViewThreeDComponent, ViewNavigatorComponent, TitleSpacingPipe],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('view3D') private view!: ViewThreeDComponent;
  @ViewChild('viewNavigator') private viewNavigator!: ViewNavigatorComponent;

  public constructor(
    @Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    private viewerService: ViewerService
  ) {
  }

  public ngAfterViewInit(): void {
    this.viewerService.init(this.view, this.viewNavigator);
  }

  public ngOnInit(): void {
  }

  @HostListener('mousedown', ['$event'])
  public mouseDown(event: MouseEvent): void {
    this.mouseService.mouseDownInvoke(event);
  }

  @HostListener('mouseup', ['$event'])
  public mouseUp(event: MouseEvent): void {
    this.mouseService.mouseUpInvoke(event);
  }

  @HostListener('mousemove', ['$event'])
  public mouseMove(event: MouseEvent): void {
    this.mouseService.mouseMoveInvoke(event);
  }

  @HostListener('document:contextmenu', ['$event'])
  public mouseContextMenu(event: MouseEvent): void {
    this.mouseService.mouseContextMenuInvoke(event);
  }
}
