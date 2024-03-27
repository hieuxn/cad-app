import { AfterViewInit, Component, ElementRef, Injector, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { PerspectiveCamera } from 'three';
import { ThreeViewLifecycleBase } from '../../models/three-view-ready.model';
import { LayerService } from '../../services/layer.service';
import { MainView3DService } from '../../services/main-view-3d.service';

export type result = 'add' | 'get'

@Component({
  selector: 'app-view-three-d',
  standalone: true,
  imports: [],
  templateUrl: './view-three-d.component.html',
  styleUrl: './view-three-d.component.scss'
})
export class ViewThreeDComponent extends ThreeViewLifecycleBase implements AfterViewInit, OnDestroy {
  @ViewChild('container') private _container!: ElementRef;
  private _snackBar: MatSnackBar
  private _layerService: LayerService;
  override mainView3DService: MainView3DService;
  debugText: string = 'Hello';

  constructor(injector: Injector) {
    super(injector);
    this._snackBar = injector.get(MatSnackBar);
    this.mainView3DService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
    const localSub = new Subscription();
    let count = 0;
    localSub.add(this._layerService.activeLayer$.subscribe(activeLayer => {
      const innerSub = activeLayer.items$.subscribe(data => {
        if (Object.keys(data.changedItem.userData).length !== 0) {
          if (data.change === 'add') this.debugText = `Object count: ${++count}`;
          else if (data.change === 'remove') this.debugText = `Object count: ${--count}`;
        }
      })
      this.subscription.add(innerSub);
      localSub.unsubscribe();
    }));
  }

  ngOnDestroy(): void {
    this.mainView3DService.dispose();
  }

  ngAfterViewInit(): void {
    this.mainView3DService.init(this._container);
    if (this.mainView3DService.activeCamera.name === PerspectiveCamera.name) {
      this._snackBar.open('Switched to Perspective Camera', 'OK', { duration: 1000 });
    } else {
      this._snackBar.open('Switched to Perspective Camera', 'OK', { duration: 1000 });
    }
  }
}
