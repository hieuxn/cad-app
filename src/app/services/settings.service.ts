import { Injectable } from "@angular/core";
import { Subject } from "rxjs";
import { Constants } from "../models/constants.model";

export type SettingsChangedArgs = { propertyName: string, newValue: number | string };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings: Map<string, any> = new Map<string, any>([
    [Constants.Settings.SnapPrecisionProperty, 1],
    [Constants.Settings.DecimalPlacesProperty, 2]
  ]);
  
  private _changed: Subject<SettingsChangedArgs> = new Subject<SettingsChangedArgs>();
  changedEvent$ = this._changed.asObservable();

  get(property: string): any {
    return this._settings.get(property);
  }

  set(property: string, value: any) {
    if (this._settings.get(property) === undefined) return;
    this._settings.set(property, value);
    this.notifyChange(property, value);
  }

  private notifyChange(property: string, value: any) {
    this._changed.next({ propertyName: property, newValue: value });
  }
}