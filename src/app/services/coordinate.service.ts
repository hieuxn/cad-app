import { Inject, Injectable } from "@angular/core";
import { Subscription, filter } from "rxjs";
import { Vector3 } from "three";
import { Constants } from "../models/constants.model";
import { MouseService, SINGLETON_MOUSE_SERVICE_TOKEN } from "./mouse.service";
import { SettingsChangedArgs, SettingsService } from "./settings.service";

type amouseAction = (event: MouseEvent) => void
type action = () => void

@Injectable({ providedIn: 'root' })
export class CoordinateService {
  private amouseAction!: amouseAction;
  private unsubAction!: action;
  private precision: number;
  private tenths: number;
  public gridSnap: boolean = false;
  private subs: Subscription = new Subscription();

  constructor(@Inject(SINGLETON_MOUSE_SERVICE_TOKEN) private mouseService: MouseService,
    private settingsService: SettingsService) {
    this.precision = settingsService.get(Constants.Settings.SnapPrecisionProperty);
    this.tenths = Math.pow(10, settingsService.get( Constants.Settings.DecimalPlacesProperty));

    this.subs.add(settingsService.changedEvent$.pipe(
      filter((value: SettingsChangedArgs) => value.propertyName === Constants.Settings.SnapPrecisionProperty),
    ).subscribe((value) => {
      this.setSnapPrecision(value.newValue as number)
    }));

    this.subs.add(settingsService.changedEvent$.pipe(
      filter((value: SettingsChangedArgs) => value.propertyName === Constants.Settings.DecimalPlacesProperty),
    ).subscribe((value) => {
      this.setDecimalPlaces(value.newValue as number)
    }));
  }

  public init(action: amouseAction, unsubAction: action) {
    this.amouseAction = action;
    this.unsubAction = unsubAction;
  }

  public show(): Subscription {
    const sub = this.mouseService.mouseMove$.subscribe(this.amouseAction);
    sub.add(() => this.unsubAction());
    return sub;
  }

  public setSnapPrecision(number: number) {
    this.precision = number;
  }

  public setDecimalPlaces(number: number) {
    this.tenths = Math.pow(10, number);
  }

  public roundVec3(position: Vector3) {
    position.set(this.round(position.x), this.round(position.y), this.round(position.z));
  }

  public snapVec3(position: Vector3) {
    position.set(+this.snap(position.x), +this.snap(position.y), +this.snap(position.z));
  }

  public round(num: number): number {
    return Math.round((num + Number.EPSILON) * this.tenths) / this.tenths;
  }

  public snap(number: number): string {
    return number.toFixed(this.precision);
  }
}