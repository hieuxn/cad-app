import { Component } from '@angular/core';
import { Raycaster, Vector2 } from 'three';
import { CoordinateService } from '../../services/coordinate.service';
import { ViewerService } from '../../services/viewer.serive';


@Component({
  selector: 'app-coordinate-display',
  standalone: true,
  imports: [],
  templateUrl: './coordinate-display.component.html',
  styleUrl: './coordinate-display.component.scss'
})

export class CoordinateDisplayComponent {
  mouseCoordinates: string = '';
  private raycaster = new Raycaster();
  private mouse = new Vector2();
  public tooltipDisplay: string = 'none';
  public tooltipLeft: string = '0px';
  public tooltipTop: string = '0px';

  public constructor(
    private viewerService: ViewerService,
    private coordinateService: CoordinateService) {
    coordinateService.init(this.onMouseMove.bind(this), this.hideCoordinate.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / this.viewerService.view3D.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / this.viewerService.view3D.renderer.domElement.clientHeight) * 2 + 1;

    const snapped = this.viewerService.ConvertMousePositionToWorldSpace(this.mouse);
    this.coordinateService.roundVec3(snapped);
    const round = this.coordinateService.gridSnap
      ? (num: number) => this.coordinateService.snap(num)
      : (num: number) => this.coordinateService.round(num);

    this.mouseCoordinates = `X: ${round(snapped.x)}, Y: ${round(snapped.y)}, Z: ${round(snapped.z)}`;
    this.tooltipDisplay = 'inline';
    this.tooltipLeft = `${event.clientX}px`;
    this.tooltipTop = `${event.clientY}px`;
  }

  private hideCoordinate() {
    this.tooltipDisplay = 'none';
  }
}
