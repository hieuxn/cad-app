import { Inject, Injectable } from "@angular/core";
import { Subscription, filter } from "rxjs";
import { Vector3 } from "three";
import { Constants } from "../../core/models/constants.model";
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from "./mouse.service";
import { SettingsChangedArgs, SettingsService } from "./settings.service";

type mouseAction = (event: MouseEvent) => void
type action = () => void

@Injectable({ providedIn: 'root' })
export class CoordinateService {
  gridSnap: boolean = false;
  private _mouseAction!: mouseAction;
  private _unsubAction!: action;
  private _precision: number;
  private _tenths: number;
  private _subs: Subscription = new Subscription();

  constructor(@Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    private settingsService: SettingsService) {
    this._precision = settingsService.get(Constants.Settings.SnapPrecisionProperty);
    this._tenths = Math.pow(10, settingsService.get( Constants.Settings.DecimalPlacesProperty));

    this._subs.add(settingsService.changedEvent$.pipe(
      filter((value: SettingsChangedArgs) => value.propertyName === Constants.Settings.SnapPrecisionProperty),
    ).subscribe((value) => {
      this.setSnapPrecision(value.newValue as number)
    }));

    this._subs.add(settingsService.changedEvent$.pipe(
      filter((value: SettingsChangedArgs) => value.propertyName === Constants.Settings.DecimalPlacesProperty),
    ).subscribe((value) => {
      this.setDecimalPlaces(value.newValue as number)
    }));
  }

  init(action: mouseAction, unsubAction: action) {
    this._mouseAction = action;
    this._unsubAction = unsubAction;
  }

  show(): Subscription {
    const sub = this.mouseService.mouseMove$.subscribe(this._mouseAction);
    sub.add(() => this._unsubAction());
    return sub;
  }

  setSnapPrecision(number: number) {
    this._precision = number;
  }

  setDecimalPlaces(number: number) {
    this._tenths = Math.pow(10, number);
  }

  roundVec3(position: Vector3) {
    position.set(this.round(position.x), this.round(position.y), this.round(position.z));
  }

  snapVec3(position: Vector3) {
    position.set(+this.snap(position.x), +this.snap(position.y), +this.snap(position.z));
  }

  round(num: number): number {
    return Math.round((num + Number.EPSILON) * this._tenths) / this._tenths;
  }

  snap(number: number): string {
    return number.toFixed(this._precision);
  }
}