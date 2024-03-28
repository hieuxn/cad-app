import { Injector } from "@angular/core";
import gsap from 'gsap';
import { Subject, debounceTime, tap } from "rxjs";
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { ViewNavigatorComponent } from "../components/view-navigator/view-navigator.component";
import { CameraChangedEvent, MainView3DService } from "../services/main-view-3d.service";
import { ObjectSelectionService } from "../services/object-selection.service";

export class ViewSyncUtils {
  private _mainView3D!: MainView3DService;
  private _viewNavigator!: ViewNavigatorComponent
  private _selectionService!: ObjectSelectionService;
  private _activeSource: 'main' | 'navigator' | null = null;
  private _sourceActivity = new Subject<'main' | 'navigator'>();
  private _mainAction = () => this._handleSourceAction('main');
  private _navigatorAction = () => this._handleSourceAction('navigator');
  private _tweens: gsap.core.Tween[] = []

  constructor(injector: Injector) {
    this._selectionService = injector.get(ObjectSelectionService);
    // this._selectionService.observable$.subscribe(this._onItemSelected.bind(this));
  }

  focus(object: Object3D) {
    if (this._mainView3D.activeCamera instanceof PerspectiveCamera) {
      this._tweens.forEach(t => t.kill());
      const controls = this._mainView3D.controls;
      const camera = this._mainView3D.activeCamera;
      const duration = 0.2;

      const newTarget = object.getWorldPosition(object.position.clone());
      const distanceToTarget = camera.position.distanceTo(newTarget);
      const direction = new Vector3().subVectors(this._mainView3D.controls.target, camera.position).normalize();
      const newPosition = new Vector3().copy(newTarget).sub(direction.multiplyScalar(distanceToTarget));

      let tween = gsap.to(camera.position, {
        x: newPosition.x,
        y: newPosition.y,
        z: newPosition.z,
        duration: duration,
        onComplete: () => {
          controls.target.copy(newTarget);
          controls.update();
          this._tweens.length = 0;
        }
      });
      this._tweens.push(tween);

      tween = gsap.to(this._mainView3D.controls.target, {
        x: newTarget.x,
        y: newTarget.y,
        z: newTarget.z,
        duration: duration,
        onUpdate: () => {
          this._mainView3D.activeCamera.lookAt(newTarget)
          this._mainView3D.controls.update();

        },
      });
      this._tweens.push(tween);
    }
  }

  sync(mainView3D: MainView3DService, viewNavigator: ViewNavigatorComponent) {
    this._mainView3D = mainView3D;
    this._viewNavigator = viewNavigator;
    this._mainView3D.onCameraChanged$.subscribe(this._onCameraChanged.bind(this))
  }

  private _onCameraChanged(event: CameraChangedEvent) {
    this._addEvent();

    if (event.isOrthographicCamera) {
      this._viewNavigator.rotateCameraToDirection(new Vector3(0, 0, 1));
    }
    else {
      const backward = new Vector3(0, 0, 1).applyQuaternion(this._mainView3D.activeCamera.quaternion);
      this._viewNavigator.rotateCameraToDirection(backward);
    }
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


    const mainCamera = this._mainView3D.activeCamera;
    const navigatorCamera = this._viewNavigator.camera;
    // const offset = mainCamera.position.clone().sub(this._newTarget);
    
    if (source == 'main') {
      const backward = new Vector3(0, 0, 1).applyQuaternion(mainCamera.quaternion);
      this._viewNavigator.rotateCameraToDirection(backward);
    }
    else {
      const forward = navigatorCamera.position;
      this._mainView3D.rotateCameraToDirection(forward);
    }
  }

  private _findIntersectionWithXYPlane(point: Vector3, direction: Vector3): Vector3 {
    if (direction.z === 0) throw new Error("The vector is parallel to the XY plane and doesn't intersect.");

    const t = -point.z / direction.z;
    const intersectionX = point.x + t * direction.x;
    const intersectionY = point.y + t * direction.y;

    return new Vector3(intersectionX, intersectionY, 0);
  }
}
