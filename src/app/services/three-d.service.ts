import { ElementRef, Injectable } from '@angular/core';
import { AxesHelper, GridHelper, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';

@Injectable({ providedIn: 'root' })
export class ThreeDService {
  public scene!: Scene;
  public camera!: PerspectiveCamera;
  public renderer!: WebGLRenderer;
  public controls!: MapControls

  public constructor() {
  }

  public init(threeContainer: ElementRef): void {
    this.scene = new Scene();
    // this.scene.background = new Color(0x888888);

    this.renderer = new WebGLRenderer();
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.onWindowResize(threeContainer));

    this.camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    // this.camera.position.y = -5;
    this.camera.position.z = 10;

    this.initControl();
    this.initGrid();
    this.animate();
  }

  private initControl() {
    this.controls = new MapControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = 2 * Math.PI;
    this.controls.minDistance = 0;
    this.controls.maxDistance = 100;
    this.controls.zoomToCursor = true;
    // this.controls.enableRotate = false;
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
    this.camera.aspect = container.nativeElement.clientWidth / container.nativeElement.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.nativeElement.clientWidth, container.nativeElement.clientHeight);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }
}
