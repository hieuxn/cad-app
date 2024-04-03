import { ElementRef, Injectable, Injector } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { AmbientLight, AxesHelper, Camera, Clock, Color, GridHelper, MOUSE, Mesh, Object3D, OrthographicCamera, PCFShadowMap, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Spherical, SpotLight, Vector3, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class CameraChangedEvent {
  public isOrthographicCamera: boolean = false;
  constructor(public camera: Camera) {
    this.isOrthographicCamera = camera.type == OrthographicCamera.name;
  }
}
@Injectable({ providedIn: 'root' })
export class MainView3DService {
  private _controlsMap: Map<string, OrbitControls> = new Map<string, OrbitControls>();
  private _clock: Clock = new Clock();
  private _onCameraChanged = new Subject<CameraChangedEvent>();
  private _viewReadySubject = new Subject<MainView3DService>();
  private _destroy = new Subject<void>();
  
  viewReady$ = this._viewReadySubject.asObservable().pipe(takeUntil(this._destroy));
  onCameraChanged$ = this._onCameraChanged.asObservable().pipe(takeUntil(this._destroy));
  destroy$ = this._destroy.asObservable();
  scene!: Scene;
  activeCamera!: Camera;
  perspectiveCamera!: PerspectiveCamera;
  orthographicCamera!: OrthographicCamera;
  renderer!: WebGLRenderer;
  readonly defaultChildCount = 4;

  get object3Ds(): Object3D[] {
    return this.scene.children;
  }

  get controls(): OrbitControls {
    return this._controlsMap.get(this.activeCamera.type)!;
  }

  constructor(injector: Injector) {
  }

  switchCamera() {
    if (this.activeCamera === this.orthographicCamera) {
      this.activeCamera = this.perspectiveCamera;
    } else {
      this.activeCamera = this.orthographicCamera;
    }

    const init = this._initControl(this.activeCamera.type);
    if (init) {
      if (this.activeCamera === this.perspectiveCamera) {
        this.activeCamera.position.set(0, -10, 5);
      }
      else {
        this.activeCamera.position.set(0, 0, 10);
      }
    }
    this._onCameraChanged.next(new CameraChangedEvent(this.activeCamera));
  }

  resetPosition() {
    this._controlsMap.forEach(item => {
      item.reset();
    });

    if (this.activeCamera === this.perspectiveCamera) {
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
    this.scene = new Scene();
    this.scene.background = new Color(0x222222);

    this.scene.add(new AmbientLight(0xaaaaaa));

    const light = new SpotLight(0xffffff, 10000);
    light.position.set(0, 25, 50);
    light.angle = Math.PI / 5;

    light.castShadow = true;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 100;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    this.scene.add(light);

    this.renderer = new WebGLRenderer();
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this._onWindowResize(threeContainer));

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.perspectiveCamera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    const scale = 2 * 64;
    this.orthographicCamera = new OrthographicCamera(-width / scale, width / scale, height / scale, -height / scale, 0.1, 1000);

    // Sync layers
    this.perspectiveCamera.layers = this.orthographicCamera.layers;

    this.switchCamera();

    this._initGrid();
    this._animate();
    this._viewReadySubject.next(this);
  }

  dispose() {
    this._destroy.next();
    this._destroy.complete();
  }

  private _initControl(cameraType: string): boolean {
    if (!this._controlsMap.get(cameraType)) {
      const controls = new OrbitControls(this.activeCamera, this.renderer.domElement);
      controls.enableDamping = false;
      controls.dampingFactor = 0.75;
      controls.screenSpacePanning = true;
      controls.minDistance = -Infinity;
      controls.mouseButtons.LEFT = null;
      controls.mouseButtons.MIDDLE = MOUSE.PAN;
      controls.mouseButtons.RIGHT = MOUSE.ROTATE;
      if (cameraType === OrthographicCamera.name) {
        controls.enableRotate = false;
      }
      this._controlsMap.set(cameraType, controls);
      return true;
    }
    return false;
  }

  private _initGrid() {
    const size: number = 500;
    const divisions: number = 500;
    const gridHelper = new GridHelper(size, divisions);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = 0;
    // const gridHelper = this._createGrid();
    this.scene.add(gridHelper);

    const axesHelper = new AxesHelper(1);
    this.scene.add(axesHelper);
  }

  private _createGrid(): Mesh {
    const gridMaterial = new ShaderMaterial({
      vertexShader: `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
      fragmentShader: `
            varying vec3 vWorldPosition;
            void main() {
                float grid = abs(sin(vWorldPosition.x * 0.1) * sin(vWorldPosition.z * 0.1));
                if(grid < 0.5) discard;
                gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
            }
        `,
      transparent: true,
    });

    const gridPlane = new PlaneGeometry(10, 10);  // Large plane for the grid
    const gridMesh = new Mesh(gridPlane, gridMaterial);
    // gridMesh.rotateX(- Math.PI / 2); // Rotate to lie flat
    return gridMesh;
  }

  private _onWindowResize(container: ElementRef) {
    if (this.activeCamera instanceof PerspectiveCamera) {
      this.activeCamera.aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
      this.activeCamera.updateProjectionMatrix();
    } else if (this.activeCamera instanceof OrthographicCamera) {
      const aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
      const frustumHeight = this.activeCamera.top - this.activeCamera.bottom;
      const frustumWidth = frustumHeight * aspect;

      this.activeCamera.left = -frustumWidth / 2;
      this.activeCamera.right = frustumWidth / 2;
      this.activeCamera.top = frustumHeight / 2;
      this.activeCamera.bottom = -frustumHeight / 2;
      this.activeCamera.updateProjectionMatrix();
    }
    this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
  }

  private _animate(): void {
    requestAnimationFrame(() => this._animate());
    const delta = this._clock.getDelta();
    this._controlsMap.forEach(kvp => kvp.update(delta));
    this.renderer.render(this.scene, this.activeCamera);
  }

  rotateCameraToDirection(targetDirection: Vector3): void {
    const centerPoint = this.controls.target;
    const radius = (this.activeCamera.position.clone().sub(centerPoint)).length();
    const targetSpherical = new Spherical().setFromVector3(targetDirection.clone().normalize().multiplyScalar(radius));
    const finalPosition = new Vector3().setFromSpherical(targetSpherical).add(centerPoint);

    this.activeCamera.position.copy(finalPosition);
    this.activeCamera.lookAt(centerPoint);
  }
}
