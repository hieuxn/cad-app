import { AfterViewInit, Component, ElementRef, Injectable, ViewChild } from '@angular/core';
import { AxesHelper, Camera, Clock, GridHelper, OrthographicCamera, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

export type result = 'add' | 'get'

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-view-three-d',
  standalone: true,
  imports: [],
  templateUrl: './view-three-d.component.html',
  styleUrl: './view-three-d.component.scss'
})
export class ViewThreeDComponent implements AfterViewInit {
  @ViewChild('container') private container!: ElementRef;
  private controlsMap: Map<string, MapControls> = new Map<string, MapControls>();
  private perspectiveCamera!: PerspectiveCamera;
  private orthogonalCamera!: OrthographicCamera;
  private clock: Clock = new Clock();
  public scene!: Scene;
  public activeCamera!: Camera;
  public renderer!: WebGLRenderer;

  public get controls(): MapControls | null {
    return this.controlsMap.get(this.activeCamera.type) || null;
  }

  public ngAfterViewInit(): void {
    this.init(this.container);
  }

  public switchCamera(): result {
    if (this.activeCamera === this.orthogonalCamera) {
      this.activeCamera = this.perspectiveCamera;
    } else {
      this.activeCamera = this.orthogonalCamera;
    }

    if (this.activeCamera === this.perspectiveCamera) {
      this.activeCamera.position.set(0, -10, 5);
    }
    else {
      this.activeCamera.position.z = 10;
    }
    return this.initControl(this.activeCamera.type);
  }


  public init(threeContainer: ElementRef): void {
    this.scene = new Scene();

    this.renderer = new WebGLRenderer();
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize(threeContainer));

    const width = container.clientWidth;
    const height = container.clientHeight;
    this.perspectiveCamera = new PerspectiveCamera(75, width / height, 0.1, 1000);
    const scale = 2 * 64;
    this.orthogonalCamera = new OrthographicCamera(-width / scale, width / scale, height / scale, -height / scale, 0.1, 1000);
    this.switchCamera();

    this.initGrid();
    this.animate();
  }

  private initControl(cameraType: string): result {
    if (!this.controlsMap.get(cameraType)) {
      const controls = new MapControls(this.activeCamera, this.renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.75;
      controls.zoomToCursor = true;
      controls.zoomSpeed = 5;
      controls.screenSpacePanning = false;
      this.controlsMap.set(cameraType, controls);
      return 'add';
    }
    return 'get';
  }

  private initGrid() {
    const size: number = 50;
    const divisions: number = 50;
    const gridHelper = new GridHelper(size, divisions);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -0.1;
    this.scene.add(gridHelper);

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
    this.controlsMap.forEach(kvp => kvp.update(delta));
    this.renderer.render(this.scene, this.activeCamera);
  }
}
