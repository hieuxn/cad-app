import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../services/mouse.service';
import { ThreeDService } from '../../services/three-d.service';
import { NavigationCubeComponent } from '../navigation-cube/navigation-cube.component';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [NavigationCubeComponent],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;
  @ViewChild('cube') cube!: ElementRef;

  public constructor(
    private threeDService: ThreeDService,
    private navigationCube: NavigationCubeComponent,
    @Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    ) {
  }
  public ngAfterViewInit(): void {
    this.threeDService.init(this.container);
    // this.navigationCube.init(this.cube, this.threeDService.camera);
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

  // @HostListener('window:click', ['$event'])
  // public onWindowClick(event: MouseEvent): void {
  //   const rect = (event.target as HTMLElement).getBoundingClientRect();
  //   const x = event.clientX - rect.left; // x position within the element.
  //   const y = event.clientY - rect.top;  // y position within the element.
  //   this.drawingService.addPoint(x, y);
  // }

  // public startDrawing(): void {
  //   this.drawingService.startDrawing();
  // }
}
