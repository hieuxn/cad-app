import { ElementRef, Injectable, Injector } from "@angular/core";
import { Subject } from "rxjs";
import { AmbientLight, AxesHelper, Camera, Clock, Color, GridHelper, Object3D, OrthographicCamera, PCFShadowMap, PerspectiveCamera, Scene, SpotLight, WebGLRenderer } from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import { ManagedLayer } from "../../core/models/managed-layer.model";

export class CameraChangedEvent {
  public isOrthographicCamera: boolean = false;
  constructor(public camera: Camera) {
    this.isOrthographicCamera = camera.type == OrthographicCamera.name;
  }
}
@Injectable({ providedIn: 'root' })
export class MainView3DService {
  private _controlsMap: Map<string, MapControls> = new Map<string, MapControls>();
  private _perspectiveCamera!: PerspectiveCamera;
  private _orthographicCamera!: OrthographicCamera;
  private _clock: Clock = new Clock();
  private _onCameraChanged = new Subject<CameraChangedEvent>();
  private _scene!: Scene;
  onCameraChanged$ = this._onCameraChanged.asObservable();
  activeCamera!: Camera;
  renderer!: WebGLRenderer;

  get object3Ds(): Object3D[] {
    return this._scene.children;
  }

  get controls(): MapControls {
    return this._controlsMap.get(this.activeCamera.type)!;
  }

  constructor(injector: Injector) {
  }

  getScene(caller: any): Scene | undefined {
    if (caller instanceof ManagedLayer) return this._scene;
    return undefined;
  }

  switchCamera() {
    if (this.activeCamera === this._orthographicCamera) {
      this.activeCamera = this._perspectiveCamera;
    } else {
      this.activeCamera = this._orthographicCamera;
    }

    if (this.activeCamera === this._perspectiveCamera) {
      this.activeCamera.position.set(0, -10, 5);
    }
    else {
      this.activeCamera.position.set(0, 0, 10);
    }
    this._initControl(this.activeCamera.type);
    this._onCameraChanged.next(new CameraChangedEvent(this.activeCamera));
  }

  resetPosition() {
    this._controlsMap.forEach(item => {
      item.reset();
    });

    if (this.activeCamera === this._perspectiveCamera) {
      this.activeCamera.position.set(0, -10, 5);
    }
    else {
      this.activeCamera.position.set(0, 0, 10);
    }

    this._controlsMap.forEach(item => {
      item.update();
    });
  }

  init(threeContainer: ElementRef): void {
    this._scene = new Scene();
    this._scene.background = new Color(0x222222);

    this._scene.add(new AmbientLight(0xaaaaaa));

    const light = new SpotLight(0xffffff, 10000);
    light.position.set(0, 25, 50);
    light.angle = Math.PI / 5;

    light.castShadow = true;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 100;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this._scene.add(light);

    this.renderer = new WebGLRenderer();
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this._onWindowResize(threeContainer));

    const width = container.clientWidth;
    const height = container.clientHeight;
    this._perspectiveCamera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    const scale = 2 * 64;
    this._orthographicCamera = new OrthographicCamera(-width / scale, width / scale, height / scale, -height / scale, 0.1, 1000);

    // Sync layers
    this._perspectiveCamera.layers = this._orthographicCamera.layers;

    this.switchCamera();

    this._initGrid();
    this._animate();
  }

  private _initControl(cameraType: string) {
    if (!this._controlsMap.get(cameraType)) {
      const controls = new MapControls(this.activeCamera, this.renderer.domElement);
      controls.enableDamping = false;
      controls.dampingFactor = 0.75;
      controls.screenSpacePanning = true;
      controls.minDistance = -Infinity;
      if (cameraType === OrthographicCamera.name) {
        controls.enableRotate = false;
      }
      this._controlsMap.set(cameraType, controls);
    }
  }

  private _initGrid() {
    const size: number = 50;
    const divisions: number = 50;
    const gridHelper = new GridHelper(size, divisions);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0;
    this._scene.add(gridHelper);

    const axesHelper = new AxesHelper(1);
    this._scene.add(axesHelper);
  }

  private _onWindowResize(container: ElementRef) {
    if (this.activeCamera instanceof PerspectiveCamera) {
      this.activeCamera.aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
      this.activeCamera.updateProjectionMatrix();
      this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
    }
  }

  private _animate(): void {
    requestAnimationFrame(() => this._animate());
    const delta = this._clock.getDelta();
    this._controlsMap.forEach(kvp => kvp.update(delta));
    this.renderer.render(this._scene, this.activeCamera);
  }
}
