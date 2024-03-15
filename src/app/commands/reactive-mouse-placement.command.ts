import { Injector } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Object3D, Vector3 } from "three";
import { MousePlacementCommand } from "./mouse-placement.command";

export class ReactiveMousePlacementCommand extends MousePlacementCommand {
  private sourceSubject = new Subject<[BehaviorSubject<Object3D[]>, Vector3[]]>();
  private destSubject = new BehaviorSubject<Object3D[]>([]);

  source$ = this.sourceSubject.asObservable();

  name: string;
  constructor(name: string, showPreview: boolean, injector: Injector) {
    super(injector);
    this.name = name;
    this.showPreviewWithoutClicking = showPreview;
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    return mouseLocations.length > 0
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D[] | null {
    this.sourceSubject.next([this.destSubject, mouseLocations])
    return this.destSubject.value;
  }
}