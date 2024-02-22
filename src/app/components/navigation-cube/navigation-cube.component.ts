import { Component, ElementRef, Injectable } from '@angular/core';
import { BoxGeometry, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, Texture, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-navigation-cube',
  standalone: true,
  imports: [],
  templateUrl: './navigation-cube.component.html',
  styleUrl: './navigation-cube.component.scss'
})
export class NavigationCubeComponent {
  public scene!: Scene;
  public camera!: PerspectiveCamera;
  public sceneCamera!: PerspectiveCamera;
  public renderer!: WebGLRenderer;
  public controls!: OrbitControls
  public cube!: Mesh;
  private container!: ElementRef;
  private rayCaster: Raycaster = new Raycaster();

  public constructor() {
  }

  public init(threeContainer: ElementRef, sceneCamera: PerspectiveCamera): void {
    this.sceneCamera = sceneCamera;
    this.container = threeContainer;
    this.scene = new Scene();

    this.renderer = new WebGLRenderer({ alpha: true });
    const container = threeContainer.nativeElement;
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.y = -3;
    this.camera.lookAt(new Vector3())

    this.initControl();
    this.initNavigationCube();
    this.animate();
    // this.initMouseEvents();

  }

  private initMouseEvents() {
    const container = this.container.nativeElement;
    container.addEventListener('mousedown', (event: MouseEvent) => this.mousedown(event));
    container.addEventListener('mouseup', (event: MouseEvent) => this.mouseup(event));
    container.addEventListener('mousemove', (event: MouseEvent) => this.mousemove(event));

  }
  private createTexturedMaterials(labels: string[]): MeshBasicMaterial[] {
    const size = 640;
    return labels.map(label => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;
      if (context) {
        context.font = '200px Arial';
        context.fillStyle = 'lightgrey';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.fillText(label, canvas.width / 2, canvas.height / 2);
      }
      const texture = new Texture(canvas);
      texture.needsUpdate = true;
      return new MeshBasicMaterial({ map: texture });
    });
  }

  private initNavigationCube() {
    const cubeMaterials = this.createTexturedMaterials(['Right', 'Left', 'Back', 'Front', 'Top', 'Bottom']);
    const cubeGeometry = new BoxGeometry(2, 2, 2);
    this.cube = new Mesh(cubeGeometry, cubeMaterials);
    // this.cube.rotateX(Math.PI * 0.5)
    this.scene.add(this.cube)
  }

  private initControl() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.125;
    this.controls.enablePan = false;

    this.controls.screenSpacePanning = true;
    this.controls.maxPolarAngle = 2 * Math.PI;
    this.controls.addEventListener('change', event => {
      // this.sceneCamera.rotation.copy(this.camera.rotation);
      this.sceneCamera.rotation.set(this.camera.rotation.x, this.camera.rotation.y, this.camera.rotation.z);
    });
  }

  private sync: boolean = false;
  private animate(): void {
    requestAnimationFrame(() => this.animate());

    // this.cube.rotation.set(this.sceneCamera.rotation.x, -this.sceneCamera.rotation.y, this.sceneCamera.rotation.z);


    this.renderer.render(this.scene, this.camera);
  }

  // Variables for mouse control
  private isDragging: boolean = false;
  private previousMousePosition: Vector2 = new Vector2(0, 0);
  private readonly rotationSpeed: number = 0.01; // Adjust rotation speed as needed

  // Function to convert degree to radian
  private toRadians(angle: number): number {
    return angle * (Math.PI / 180);
  }

  public mousedown(event: MouseEvent) {
    const container = this.container.nativeElement;
    const mouse = new Vector2((event.offsetX / container.clientWidth) * 2 - 1, -(event.offsetY / container.clientHeight) * 2 + 1);
    this.rayCaster.setFromCamera(mouse, this.camera);
    const intersects = this.rayCaster.intersectObject(this.cube);
    this.isDragging = intersects.length > 0;
    if (!this.isDragging) return;
    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
  };

  public mousemove(event: MouseEvent) {
    if (this.isDragging) {
      const deltaX = event.clientX - this.previousMousePosition.x;
      const deltaY = event.clientY - this.previousMousePosition.y;

      const rotationY = this.toRadians(deltaX * this.rotationSpeed);
      const rotationX = this.toRadians(deltaY * this.rotationSpeed);

      const scale = 50;
      this.cube.rotation.y += rotationY * scale;
      this.cube.rotation.x += rotationX * scale;

      this.previousMousePosition.x = event.clientX;
      this.previousMousePosition.y = event.clientY;
    }
  };

  public mouseup(event: MouseEvent) {
    this.isDragging = false;
  };
}