import { Inject, Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { Object3D, Plane, Raycaster, Vector2, Vector3 } from 'three';
import { Layer } from '../../../models/layer.model';
import { ContextMenuService, ContextMenuWrapper } from '../../../services/context-menu.service';
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from '../../../services/mouse.service';
import { ThreeDService } from '../../../services/three-d.service';
import { ContextMenuCommandBase } from '../../context-menu/commands/context-menu-command-base';

@Injectable({ providedIn: "root" })
export abstract class DrawingCommand {
  public abstract name: string;
  protected drawOnMouseDown: boolean = true;
  protected mouseLocations: Vector3[] = [];
  protected subscriptions: Subscription | null = null;
  protected contextMenuWrapper!: ContextMenuWrapper;
  private object3Ds: Object3D[] | null = [];
  protected layer: Layer | null = null;
  private mouseUpCount: number = 0;
  protected contextMenuCommmands: ContextMenuCommandBase[] = [];

  constructor(
    @Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    contextMenuService: ContextMenuService,
    private threeDService: ThreeDService,
  ) {
    this.contextMenuWrapper ??= contextMenuService.lazyGet();
    this.onInit();
  }

  public execute(layer: Layer) {
    if (!layer) return;
    this.layer = layer;
    this.plane = new Plane(new Vector3(0, 0, 1), -this.layer.elevation)
    this.initEvents();
  }

  public cancel() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe()
      this.subscriptions = null;
      this.object3Ds = null;
      this.mouseUpCount = 0;
      this.mouseLocations.length = 0;
    }
  }

  protected onInit() {
  }

  protected onKeyDown(event: KeyboardEvent) {
  }

  protected onKeyUp(event: KeyboardEvent) {
  }

  protected onMouseClick(mouseLocation: Vector3) {
    if (this.mouseLocations.length > 0) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    else this.mouseLocations.push(mouseLocation);
    ++this.mouseUpCount;

    const isFinished = this.isFinished(this.mouseLocations);
    if (this.mouseLocations.length > 0) this.drawShape();
    if (!isFinished) return;

    this.cancel();
  }

  protected onMouseMove(mouseLocation: Vector3) {
    if (this.mouseLocations.length == 0) return;
    if (this.mouseUpCount == this.mouseLocations.length) this.mouseLocations.push(mouseLocation);
    else if (this.mouseUpCount + 1 == this.mouseLocations.length) this.mouseLocations[this.mouseLocations.length - 1] = mouseLocation;
    if (this.mouseLocations.length > 0) this.drawShape();
  }

  protected onMenuContextOpen(mouseEvent: MouseEvent) {
  }

  protected abstract isFinished(mouseLocations: Vector3[]): boolean;

  protected abstract drawShapeImplementation(mouseLocations: Vector3[]): Object3D[] | null;

  private initEvents() {
    this.subscriptions = new Subscription();
    this.subscriptions.add(this.mouseService.mouseDown$
      .subscribe((event: MouseEvent) => {
        this.handleMouseDown(event);
      }));

    this.subscriptions.add(this.mouseService.mouseUp$
      .subscribe((event: MouseEvent) => {
        this.handleMouseUp(event);
      }));

    this.subscriptions.add(this.mouseService.mouseMove$
      .subscribe((event: MouseEvent) => {
        this.handleMouseMove(event);
      }));

    this.subscriptions.add(this.mouseService.mouseContextMenu$
      .subscribe((event: MouseEvent) => {
        this.onMenuContextOpen(event);
      }));


    // this.subscriptions.add(this.keyboardService.keyDown$
    //     .subscribe((event: KeyboardEvent) => {
    //         this.onKeyDown(event);
    //     }));

    // this.subscriptions.add(this.keyboardService.keyUp$
    //     .subscribe((event: KeyboardEvent) => {
    //         this.onKeyUp(event);
    //     }));
  }

  private raycaster: Raycaster = new Raycaster();
  private plane!: Plane;//= new Plane(new Vector3(0, 0, 1), 0);

  private raycastMouse(event: MouseEvent): Vector3 | null {
    const mouse = new Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(mouse, this.threeDService.camera);
    const pointerPosition = new Vector3();
    this.raycaster.ray.intersectPlane(this.plane, pointerPosition);
    if (!pointerPosition) return null;
    return pointerPosition;
  }

  private handleMouseDown(event: MouseEvent) {
    if (event.button != 0) return;
    if (!this.drawOnMouseDown) return;

    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;
    this.onMouseClick(pointerPosition);
  }

  private handleMouseUp(event: MouseEvent) {
    if (event.button != 0) return;
    if (this.drawOnMouseDown) return;

    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;

    pointerPosition.z = this.layer!.elevation;
    this.onMouseClick(pointerPosition);
  }

  private handleMouseMove(event: MouseEvent) {
    if (event.button != 0) return;
    const pointerPosition = this.raycastMouse(event);
    if (!pointerPosition) return;

    pointerPosition.z = this.layer!.elevation;
    this.onMouseMove(pointerPosition);
  }

  private drawShape() {
    if (this.object3Ds) {
      this.layer?.removeLastObjects(...this.object3Ds);
    }


    this.object3Ds = this.drawShapeImplementation(this.mouseLocations)
    if (!this.object3Ds) {
      return;
    }

    if (this.layer) {
      this.layer.addObjects(...this.object3Ds);
    }
  }
}
