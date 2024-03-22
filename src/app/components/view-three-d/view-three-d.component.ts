import { AfterViewInit, Component, ElementRef, Injector, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PerspectiveCamera } from 'three';
import { MainView3DService } from '../../services/main-view-3d.service';

export type result = 'add' | 'get'

@Component({
  selector: 'app-view-three-d',
  standalone: true,
  imports: [],
  templateUrl: './view-three-d.component.html',
  styleUrl: './view-three-d.component.scss'
})
export class ViewThreeDComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') private _container!: ElementRef;
  private _snackBar: MatSnackBar
  mainView3DService: MainView3DService;

  constructor(injector: Injector) {
    this._snackBar = injector.get(MatSnackBar);
    this.mainView3DService = injector.get(MainView3DService);
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
