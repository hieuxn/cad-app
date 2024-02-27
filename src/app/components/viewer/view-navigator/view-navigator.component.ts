import { AfterViewInit, Component, ElementRef, HostListener, Injectable, OnDestroy, ViewChild } from '@angular/core';
import { AxesHelper, Camera, Clock, Object3D, OrthographicCamera, Raycaster, Scene, Spherical, Sprite, SpriteMaterial, Texture, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewerService } from '../../../services/viewer.serive';

export type axis = 'x' | 'y' | 'z';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-view-navigator',
  standalone: true,
  imports: [],
  templateUrl: './view-navigator.component.html',
  styleUrl: './view-navigator.component.scss'
})
export class ViewNavigatorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('viewNavigator') private viewNavigator!: ElementRef;

  private readonly labelOffset = 1.2;
  private width!: number;
  private height!: number;
  private axesHelper!: AxesHelper
  private clock: Clock = new Clock();
  private raycaster: Raycaster = new Raycaster();
  private readonly directions: Map<string, Vector3> = new Map<string, Vector3>([

    ['X', new Vector3(1, 0, 0)],
    ['-X', new Vector3(-1, 0, 0)],
    ['Y', new Vector3(0, 1, 0)],
    ['-Y', new Vector3(0, -1, 0)],
    ['Z', new Vector3(0, 0, 1)],
    ['-Z', new Vector3(0, 0, -1)]
  ]);

  private _scene!: Scene;
  private _camera!: OrthographicCamera;
  private _renderer!: WebGLRenderer;
  private _controls!: OrbitControls;
  private _axesGroup!: Object3D
  public get camera(): Camera { return this._camera; }
  public get renderer(): WebGLRenderer { return this._renderer; }
  public get scene(): Scene { return this._scene; }
  public get controls(): OrbitControls { return this._controls; }
  public get axesGroup(): Object3D { return this._axesGroup; }

  constructor(private viewService: ViewerService) {

  }

  public ngAfterViewInit(): void {
    this.init(this.viewNavigator)
  }

  private init(container: ElementRef) {
    this._scene = new Scene();
    this._axesGroup = new Object3D();
    const nativeElement = container.nativeElement;

    const scale = 1.7;
    this._camera = new OrthographicCamera(-scale, scale, scale, -scale, 5, 1000);
    this._camera.position.z = 10;

    this.width = nativeElement.clientWidth;
    this.height = nativeElement.clientHeight;

    this._renderer = new WebGLRenderer({ alpha: true });
    this._renderer.setSize(this.width, this.height);
    nativeElement.appendChild(this._renderer.domElement);

    this._controls = new OrbitControls(this.camera, this.renderer.domElement);
    this._controls.enableDamping = true;
    this.controls.dampingFactor = 0.15;
    this._controls.enableZoom = false;
    this._controls.screenSpacePanning = false;
    this._controls.enablePan = false;

    const labelX = this.createLabel('X', 'red');
    labelX.position.set(this.labelOffset, 0, 0);
    this._axesGroup.add(labelX);
    const labelX2 = this.createLabel('-X', 'red', false);
    labelX2.position.set(-this.labelOffset, 0, 0);
    this._axesGroup.add(labelX2);

    const labelY = this.createLabel('Y', 'green');
    labelY.position.set(0, this.labelOffset, 0);
    this._axesGroup.add(labelY);
    const labelY2 = this.createLabel('-Y', 'green', false);
    labelY2.position.set(0, -this.labelOffset, 0);
    this._axesGroup.add(labelY2);

    const labelZ = this.createLabel('Z', 'blue');
    labelZ.position.set(0, 0, this.labelOffset);
    this._axesGroup.add(labelZ);
    const labelZ2 = this.createLabel('-Z', 'blue', false);
    labelZ2.position.set(0, 0, -this.labelOffset);
    this._axesGroup.add(labelZ2);

    this.axesHelper = new AxesHelper();
    this._axesGroup.add(this.axesHelper);

    this._scene.add(this._axesGroup);

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
    const delta = this.clock.getDelta();
    this._controls.update(delta);
    this._renderer.render(this._scene, this._camera);
  }

  public ngOnDestroy(): void {
    if (this._renderer) {
      this._renderer.dispose();
    }
  }

  public switchCamera(): void {
    this.viewService.switchCamera();
  }

  @HostListener('mousedown', ['$event'])
  private onMouseDown(event: MouseEvent) {
    const mouse = new Vector2();
    mouse.x = (event.offsetX / this.width) * 2 - 1;
    mouse.y = -(event.offsetY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this._axesGroup.children);
    for (let i = 0; i < intersects.length; i++) {
      const label = intersects[i].object;
      if (!(label instanceof Sprite)) continue;

      const targetDirection = this.directions.get(label.name);
      if (!targetDirection) continue;

      this.rotateCameraToDirection(targetDirection);
    }
  }

  private rotateCameraToDirection(targetDirection: Vector3): void {
    const spherical = new Spherical().setFromVector3(targetDirection);
    spherical.radius = this.camera.position.length();
    const newPosition = new Vector3().setFromSpherical(spherical);
    this.camera.position.copy(newPosition);
    this._axesGroup.lookAt(new Vector3());
  }
}
