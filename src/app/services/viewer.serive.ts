import { Injectable } from "@angular/core";
import { Subject, debounceTime, tap } from "rxjs";
import { Vector2, Vector3 } from "three";
import { ViewNavigatorComponent } from "../components/viewer/view-navigator/view-navigator.component";
import { ViewThreeDComponent } from "../components/viewer/view-three-d/view-three-d.component";

@Injectable({ providedIn: 'root' })
export class ViewerService {
  private _view3D!: ViewThreeDComponent;
  private viewNavigator!: ViewNavigatorComponent
  private activeSource: 'main' | 'navigator' | null = null;
  private sourceActivity = new Subject<'main' | 'navigator'>();


  public get view3D(): ViewThreeDComponent {
    return this._view3D;
  }

  public init(view3D: ViewThreeDComponent, viewNavigator: ViewNavigatorComponent) {
    this._view3D = view3D;
    this.viewNavigator = viewNavigator;
    this.addEvent();
  }

  public switchCamera() {
    const result = this._view3D.switchCamera();
    if (result === 'add') {
      this.addEvent();
    }
    this._view3D.resetPosition();
    this.viewNavigator.resetPosition();
    const axesGroup = this.viewNavigator.axesGroup;
    const mainCamera = this._view3D.activeCamera;
    axesGroup.quaternion.copy(mainCamera.quaternion);
    axesGroup.quaternion.w *= -1;
  }

  private addEvent() {
    this.initializeSourceControl();
    const viewControl = this._view3D.controls;
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
    const mainCamera = this._view3D.activeCamera;
    const navigatorCamera = this.viewNavigator.camera;
    // if (mainCamera.type == OrthographicCamera.name) return;
    // console.log(source);
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

  public ConvertMousePositionToWorldSpace(mouseNDC: Vector2): Vector3 {
    return this.view3D.ConvertMousePositionToWorldSpace(mouseNDC);
  }
}
