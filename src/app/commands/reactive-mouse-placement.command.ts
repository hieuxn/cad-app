import { KeyValue } from "@angular/common";
import { Injector } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { Group, Object3D, Vector3 } from "three";
import { MousePlacementCommand } from "./mouse-placement.command";

export class ReactiveMousePlacementCommand extends MousePlacementCommand {
  private _sourceSubject = new Subject<[BehaviorSubject<KeyValue<string, Group>>, Vector3[]]>();
  private _destSubject = new BehaviorSubject<KeyValue<string, Group>>({ key: '', value: new Group() });
  private _isFinished = false;
  private _currentParent: Group | undefined = undefined;

  source$ = this._sourceSubject.asObservable();
  name: string;

  constructor(name: string, showPreview: boolean, injector: Injector) {
    super(injector);
    this.name = name;
    this.showPreviewWithoutClicking = showPreview;
  }

  override execute(): void {
    this._isFinished = false;
    this._currentParent = undefined;
    super.execute();
  }

  protected override isFinished(mouseLocations: Vector3[]): boolean {
    super.isFinished(mouseLocations);
    this._isFinished = mouseLocations.length > 0
    return this._isFinished;
  }

  protected override onCommandExecute(mouseLocations: Vector3[]): Object3D[] | null {
    this._sourceSubject.next([this._destSubject, mouseLocations])
    if (!this._destSubject.value) return null;
    const { key, value } = this._destSubject.value;
    if (undefined === this._currentParent && false === this._isFinished) {
      this._currentParent = this._layerService.activeLayer.objects.get(key) as Group;
      this._currentParent.add(value);
      return null;
    }
    else if (this._currentParent) {
      const lastChild = this._currentParent.children.at(-1);
      if (lastChild) this._currentParent.remove(lastChild);
      this._currentParent.add(value);
      return null;
    }
    return [this._destSubject.value.value];
  }
}