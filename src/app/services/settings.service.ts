import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Constants } from "../models/constants.model";

export type SettingsChangedArgs = { propertyName: string, newValue: number | string };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settings: Map<string, any> = new Map<string, any>([
    [Constants.Settings.SnapPrecisionProperty, 1],
    [Constants.Settings.DecimalPlacesProperty, 2]
  ]);

  private changed: Subject<SettingsChangedArgs> = new Subject<SettingsChangedArgs>();
  public changedEvent$ = this.changed.asObservable();

  public get(property: string): any {
    return this.settings.get(property);
  }

  public set(property: string, value: any) {
    if (this.settings.get(property) === undefined) return;
    this.settings.set(property, value);
    this.notifyChange(property, value);
  }

  private notifyChange(property: string, value: any) {
    this.changed.next({ propertyName: property, newValue: value });
  }
}