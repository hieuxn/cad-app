import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AxesHelper, Camera, Clock, Object3D, OrthographicCamera, Raycaster, Scene, Sprite, SpriteMaterial, Texture, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MainView3DService } from '../../services/main-view-3d.service';

export type axis = 'x' | 'y' | 'z';

@Component({
  selector: 'app-view-navigator',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './view-navigator.component.html',
  styleUrl: './view-navigator.component.scss'
})
export class ViewNavigatorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewNavigator') private _viewNavigator!: ElementRef;

  private readonly _labelOffset = 1.2;
  private _width!: number;
  private _height!: number;
  private _axesHelper!: AxesHelper
  private _clock: Clock = new Clock();
  private _raycaster: Raycaster = new Raycaster();
  private readonly _directions: Map<string, Vector3> = new Map<string, Vector3>([
    ['X', new Vector3(10, 0, 0)],
    ['-X', new Vector3(-10, 0, 0)],
    ['Y', new Vector3(0, 10, 0)],
    ['-Y', new Vector3(0, -10, 0)],
    ['Z', new Vector3(0, 0, 10)],
    ['-Z', new Vector3(0, 0, -10)]
  ]);

  private _scene!: Scene;
  private _camera!: OrthographicCamera;
  private _renderer!: WebGLRenderer;
  private _controls!: OrbitControls;
  private _gizmo!: Object3D
  get camera(): Camera { return this._camera; }
  get renderer(): WebGLRenderer { return this._renderer; }
  get scene(): Scene { return this._scene; }
  get controls(): OrbitControls { return this._controls; }
  get gizmo(): Object3D { return this._gizmo; }
  isOrthographicCamera = true;

  private checkCamera() {
    if (!this._mainViewService.activeCamera) this.isOrthographicCamera = true;
    this.isOrthographicCamera = this._mainViewService.activeCamera.type == OrthographicCamera.name;;
  };

  constructor(private _mainViewService: MainView3DService) {
  }

  ngAfterViewInit(): void {
    this.init(this._viewNavigator)
  }

  ngOnDestroy(): void {
    if (this._renderer) {
      this._renderer.dispose();
    }
  }

  resetPosition() {
    this._gizmo.position.set(0, 0, 0);
    this._gizmo.rotation.set(0, 0, 0);
    this._controls.reset();
    this._camera.position.set(0, 0, 10);
  }

  private init(container: ElementRef) {
    this._scene = new Scene();
    this._gizmo = new Object3D();
    const nativeElement = container.nativeElement;

    const scale = 1.7;
    this._camera = new OrthographicCamera(-scale, scale, scale, -scale, 5, 1000);

    this._width = nativeElement.clientWidth;
    this._height = nativeElement.clientHeight;

    this._renderer = new WebGLRenderer({ alpha: true });
    this._renderer.setSize(this._width, this._height);
    nativeElement.appendChild(this._renderer.domElement);

    this._controls = new OrbitControls(this.camera, this.renderer.domElement);
    this._controls.enableDamping = false;
    this.controls.dampingFactor = 0.15;
    this._controls.enableZoom = false;
    this._controls.screenSpacePanning = false;
    this._controls.enablePan = false;

    const labelX = this.createLabel('X', 'red');
    labelX.position.set(this._labelOffset, 0, 0);
    this._gizmo.add(labelX);
    const labelX2 = this.createLabel('-X', 'red', false);
    labelX2.position.set(-this._labelOffset, 0, 0);
    this._gizmo.add(labelX2);

    const labelY = this.createLabel('Y', 'green');
    labelY.position.set(0, this._labelOffset, 0);
    this._gizmo.add(labelY);
    const labelY2 = this.createLabel('-Y', 'green', false);
    labelY2.position.set(0, -this._labelOffset, 0);
    this._gizmo.add(labelY2);

    const labelZ = this.createLabel('Z', 'blue');
    labelZ.position.set(0, 0, this._labelOffset);
    this._gizmo.add(labelZ);
    const labelZ2 = this.createLabel('-Z', 'blue', false);
    labelZ2.position.set(0, 0, -this._labelOffset);
    this._gizmo.add(labelZ2);

    this._axesHelper = new AxesHelper();
    this._gizmo.add(this._axesHelper);

    this._scene.add(this._gizmo);

    this.resetPosition()
    this.animate();
  }

  private createLabel(text: string, color: string, fill: boolean = true) {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (context) {
      const radius = size / 2;
      context.beginPath();
      context.arc(radius, radius, radius, 0, 2 * Math.PI, false);
      if (fill) context.fillStyle = color;
      context.fill();

      context.lineWidth = 10;
      context.strokeStyle = color;
      context.stroke();

      context.font = '154px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, size / 2, size / 2);
    }

    const texture = new Texture(canvas);
    texture.needsUpdate = true;

    const material = new SpriteMaterial({ map: texture });
    const sprite = new Sprite(material);
    sprite.scale.set(0.5, 0.5, 1);
    sprite.name = text;

    return sprite;
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this._clock.getDelta();
    this._controls.update(delta);
    this._renderer.render(this._scene, this._camera);
  }

  switchCamera(): void {
    this._mainViewService.switchCamera();
    this.checkCamera();
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(event: MouseEvent) {
    this._controls.enableRotate = !this.isOrthographicCamera;
    if (!this._controls.enableRotate) return;
    const mouse = new Vector2();
    mouse.x = (event.offsetX / this._width) * 2 - 1;
    mouse.y = -(event.offsetY / this._height) * 2 + 1;

    this._raycaster.setFromCamera(mouse, this.camera);
    const intersects = this._raycaster.intersectObjects(this._gizmo.children);
    for (let i = 0; i < intersects.length; i++) {
      const label = intersects[i].object;
      if (!(label instanceof Sprite)) continue;

      const targetDirection = this._directions.get(label.name);
      if (targetDirection === undefined) continue;

      this.rotateCameraToDirection(targetDirection);
      break;
    }
  }

  private rotateCameraToDirection(targetDirection: Vector3): void {
    this._gizmo.rotation.set(0, 0, 0);
    this._camera.position.copy(targetDirection);
    this._camera.lookAt(new Vector3());
    this.controls.update();
    this._mainViewService.controls?.reset();
    this._mainViewService.activeCamera.position.copy(this._camera.position);
    this._mainViewService.controls?.update();
  }
}
