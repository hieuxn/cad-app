import { Subject, debounceTime, tap } from "rxjs";
import { ViewNavigatorComponent } from "../../core/components/viewer/view-navigator/view-navigator.component";
import { CameraChangedEvent, MainView3DService } from "../services/main-view-3d.service";

export class ViewSyncUtils {
  private _mainView3D!: MainView3DService;
  private _viewNavigator!: ViewNavigatorComponent
  private _activeSource: 'main' | 'navigator' | null = null;
  private _sourceActivity = new Subject<'main' | 'navigator'>();
  private _mainAction = () => this._handleSourceAction('main');
  private _navigatorAction = () => this._handleSourceAction('navigator');

  sync(mainView3D: MainView3DService, viewNavigator: ViewNavigatorComponent) {
    this._mainView3D = mainView3D;
    this._viewNavigator = viewNavigator;
    this._mainView3D.onCameraChanged$.subscribe(this._onCameraChanged.bind(this))
  }

  private _onCameraChanged(event: CameraChangedEvent) {
    this._addEvent();
    this._mainView3D.resetPosition();
    this._viewNavigator.resetPosition();
    const axesGroup = this._viewNavigator.gizmo;
    const mainCamera = this._mainView3D.activeCamera;
    axesGroup.quaternion.copy(mainCamera.quaternion);
    axesGroup.quaternion.w *= -1;
  }

  private _addEvent() {
    const viewControl = this._mainView3D.controls;
    const navigatorControl = this._viewNavigator.controls;
    if (viewControl.hasEventListener('change', this._mainAction) && navigatorControl.hasEventListener('change', this._navigatorAction)) return;

    this._initializeSourceControl();

    viewControl.addEventListener('change', this._mainAction);
    navigatorControl.addEventListener('change', this._navigatorAction);
  }

  private _initializeSourceControl() {
    this._sourceActivity.pipe(
      tap({
        next: source => {
          if (!this._activeSource) this._activeSource = source;
        }
      }),
      debounceTime(50),
    ).subscribe({
      next: source => {
        this._activeSource = null;
      }
    });
  }

  private _handleSourceAction(source: 'main' | 'navigator') {
    this._sourceActivity.next(source);
    if (source === null || source != this._activeSource) return;

    const axesGroup = this._viewNavigator.gizmo;
    const mainCamera = this._mainView3D.activeCamera;
    const navigatorCamera = this._viewNavigator.camera;
    // if (mainCamera.type == OrthographicCamera.name) return;
    // console.log(source);
    if (source == 'main') {
      axesGroup.quaternion.copy(mainCamera.quaternion);
      axesGroup.quaternion.w *= -1;
    }
    else {
      mainCamera.position.copy(navigatorCamera.position);
      mainCamera.rotation.copy(this._viewNavigator.camera.rotation);
      mainCamera.quaternion.w *= -1;
    }
  }
}
