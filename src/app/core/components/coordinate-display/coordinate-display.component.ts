import { Component, Injector } from '@angular/core';
import { CoordinateService } from '../../../shared/services/coordinate.service';
import { LayerService } from '../../../shared/services/layer.service';


@Component({
  selector: 'app-coordinate-display',
  standalone: true,
  imports: [],
  templateUrl: './coordinate-display.component.html',
  styleUrl: './coordinate-display.component.scss'
})

export class CoordinateDisplayComponent {
  mouseCoordinates: string = '';
  tooltipDisplay: string = 'none';
  tooltipLeft: string = '0px';
  tooltipTop: string = '0px';
  private _coordinateService: CoordinateService;
  private _layerService: LayerService;

  constructor(injector: Injector) {
    this._coordinateService = injector.get(CoordinateService);
    this._layerService = injector.get(LayerService);
    this._coordinateService.init(this.onMouseMove.bind(this), this.hideCoordinate.bind(this));
  }

  private onMouseMove(event: MouseEvent): void {
    const snapped = this._layerService.convertMouseEventToWorldSpace(event);
    this._coordinateService.roundVec3(snapped);
    const round = this._coordinateService.gridSnap
      ? (num: number) => this._coordinateService.snap(num)
      : (num: number) => this._coordinateService.round(num);

    this.mouseCoordinates = `X: ${round(snapped.x)}, Y: ${round(snapped.y)}, Z: ${round(snapped.z)}`;
    this.tooltipDisplay = 'inline';
    this.tooltipLeft = `${event.clientX}px`;
    this.tooltipTop = `${event.clientY}px`;
  }

  private hideCoordinate() {
    this.tooltipDisplay = 'none';
  }
}
