import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AxesHelper, Camera, Clock, OrthographicCamera, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { LayerService } from '../../../services/layer.service';

export type result = 'add' | 'get'

@Component({
  selector: 'app-view-three-d',
  standalone: true,
  imports: [],
  templateUrl: './view-three-d.component.html',
  styleUrl: './view-three-d.component.scss'
})
export class ViewThreeDComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container') private container!: ElementRef;
  private controlsMap: Map<string, MapControls> = new Map<string, MapControls>();
  private perspectiveCamera!: PerspectiveCamera;
  private orthographicCamera!: OrthographicCamera;
  private clock: Clock = new Clock();
  public scene!: Scene;
  public activeCamera!: Camera;
  public renderer!: WebGLRenderer;

  public constructor(private snackBar: MatSnackBar, private layerService: LayerService) { }
  ngOnDestroy(): void {
  }

  public get controls(): MapControls | null {
    return this.controlsMap.get(this.activeCamera.type) || null;
  }

  public ngAfterViewInit(): void {
    this.init(this.container);
  }

  public switchCamera(): result {
    if (this.activeCamera === this.orthographicCamera) {
      this.activeCamera = this.perspectiveCamera;
      this.snackBar.open('Switched to Perspective Camera', 'OK', { duration: 1000 });
    } else {
      this.activeCamera = this.orthographicCamera;
      this.snackBar.open('Switched to Orthographic Camera', 'OK', { duration: 1000 });
    }

    if (this.activeCamera === this.perspectiveCamera) {
      this.activeCamera.position.set(0, -10, 5);
    }
    else {
      this.activeCamera.position.set(0, 0, 10);
    }
    return this.initControl(this.activeCamera.type);
  }

  public resetPosition() {
    this.controlsMap.forEach(item => {
      item.reset();
    });

    if (this.activeCamera === this.perspectiveCamera) {
      this.activeCamera.position.set(0, -10, 5);
    }
    else {
      this.activeCamera.position.set(0, 0, 10);
    }

    this.controlsMap.forEach(item => {
      item.update();
    });
  }

  public init(threeContainer: ElementRef): void {
    this.scene = new Scene();
    // this.scene.background = new Color(0xEEEEEE);

    this.renderer = new WebGLRenderer();
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize(threeContainer));

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.perspectiveCamera = new PerspectiveCamera(75, width / height, 0.1, 1000);

    const scale = 2 * 64;
    this.orthographicCamera = new OrthographicCamera(-width / scale, width / scale, height / scale, -height / scale, 0.1, 1000);

    // Sync layers
    this.perspectiveCamera.layers = this.orthographicCamera.layers;

    this.switchCamera();

    this.initGrid();
    this.animate();
  }

  private initControl(cameraType: string): result {
    if (!this.controlsMap.get(cameraType)) {
      const controls = new MapControls(this.activeCamera, this.renderer.domElement);
      controls.enableDamping = false;
      controls.dampingFactor = 0.75;
      controls.screenSpacePanning = true;
      controls.minDistance = -Infinity;
      if (cameraType === OrthographicCamera.name) {
        controls.enableRotate = false;
      }
      this.controlsMap.set(cameraType, controls);
      return 'add';
    }
    return 'get';
  }

  private initGrid() {
    const size: number = 50;
    const divisions: number = 50;
    // const gridHelper = new GridHelper(size, divisions);
    // gridHelper.rotation.x = Math.PI / 2;
    // gridHelper.position.z = 0;
    // this.scene.add(gridHelper);

    const axesHelper = new AxesHelper(1);
    this.scene.add(axesHelper);
  }

  private onWindowResize(container: ElementRef) {
    if (this.activeCamera instanceof PerspectiveCamera) {
      this.activeCamera.aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
      this.activeCamera.updateProjectionMatrix();
      this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    // if (!this.timeoutRef) {
    this.controlsMap.forEach(kvp => kvp.update(delta));
    // }
    this.renderer.render(this.scene, this.activeCamera);
  }

  public ConvertMousePositionToWorldSpace(mouseNDC: Vector2): Vector3 {
    const z = this.layerService.activeLayer?.elevation ?? 0;
    if (this.activeCamera === this.orthographicCamera) {
      const tempZ = (this.orthographicCamera.near + this.orthographicCamera.far) / (this.orthographicCamera.near - this.orthographicCamera.far);
      const pos = new Vector3(mouseNDC.x, mouseNDC.y, tempZ);
      pos.applyMatrix4(this.orthographicCamera.projectionMatrixInverse).add(this.orthographicCamera.position);
      pos.z = z;
      return pos;
    } else {
      const tempPos = new Vector3(mouseNDC.x, mouseNDC.y, 0.5);
      tempPos.unproject(this.perspectiveCamera);
      tempPos.sub(this.perspectiveCamera.position).normalize();
      var distance = - this.perspectiveCamera.position.z / tempPos.z;
      const position = new Vector3().copy(this.perspectiveCamera.position).add(tempPos.multiplyScalar(distance))
      position.z = z;
      return position;
    }
  }
}
