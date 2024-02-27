import { Injectable } from "@angular/core";
import { Subject, debounceTime, tap } from "rxjs";
import { Camera, Scene } from "three";
import { ViewNavigatorComponent } from "../components/viewer/view-navigator/view-navigator.component";
import { ViewThreeDComponent } from "../components/viewer/view-three-d/view-three-d.component";

@Injectable({ providedIn: 'root' })
export class ViewerService {
  private view3D!: ViewThreeDComponent;
  private viewNavigator!: ViewNavigatorComponent
  private activeSource: 'main' | 'navigator' | null = null;
  private sourceActivity = new Subject<'main' | 'navigator'>();

  public get scene(): Scene {
    return this.view3D.scene;
  }

  public get camera(): Camera {
    return this.view3D.activeCamera;
  }

  public init(view3D: ViewThreeDComponent, viewNavigator: ViewNavigatorComponent) {
    this.view3D = view3D;
    this.viewNavigator = viewNavigator;
    this.addEvent();
  }

  public switchCamera() {
    const result = this.view3D.switchCamera();
    if (result === 'add') {
      this.addEvent();
    }

    const mainCamera = this.camera;
    const navigatorCamera = this.viewNavigator.camera;
    mainCamera.position.copy(navigatorCamera.position);
    mainCamera.quaternion.copy(this.viewNavigator.camera.quaternion);
    mainCamera.quaternion.w *= -1;
  }

  private addEvent() {
    this.initializeSourceControl();
    const viewControl = this.view3D.controls;
    if (viewControl) {
      viewControl.addEventListener('change', () => {
        this.handleSourceAction('main');
      });
    }

    const navigatorControl = this.viewNavigator.controls;
    if (navigatorControl) {
      navigatorControl.addEventListener('change', () => {
        this.handleSourceAction('navigator');
      });
    }
  }

  private initializeSourceControl() {
    this.sourceActivity.pipe(
      tap({
        next: source => {
          if (!this.activeSource) this.activeSource = source;
        }
      }),
      debounceTime(50),
    ).subscribe({
      next: source => {
        this.activeSource = null;
      }
    });
  }

  public handleSourceAction(source: 'main' | 'navigator') {
    this.sourceActivity.next(source);
    if (source === null || source != this.activeSource) return;

    const axesGroup = this.viewNavigator.axesGroup;
    const mainCamera = this.camera;
    const navigatorCamera = this.viewNavigator.camera;
    console.log(source);
    if (source == 'main') {
      axesGroup.quaternion.copy(mainCamera.quaternion);
      axesGroup.quaternion.w *= -1;
    }
    else {
      mainCamera.position.copy(navigatorCamera.position);
      mainCamera.rotation.copy(this.viewNavigator.camera.rotation);
      mainCamera.quaternion.w *= -1;
    }
  }
}
