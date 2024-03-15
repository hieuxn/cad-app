import { Injectable, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Subject } from "rxjs";
import { SettingsDialogComponent } from "../components/sidebar/settings-dialog/settings-dialog.component";
import { Constants } from "../models/constants.model";

export type SettingsChangedArgs = { propertyName: string, newValue: number | string };

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _settings: Map<string, any> = new Map<string, any>([
    [Constants.Settings.SnapPrecisionProperty, 1],
    [Constants.Settings.DecimalPlacesProperty, 2]
  ]);
  private _changed: Subject<SettingsChangedArgs> = new Subject<SettingsChangedArgs>();
  private _dialog: MatDialog = inject(MatDialog);
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

  openSettingsDialog() {
    const dialogRef = this._dialog.open(SettingsDialogComponent, {
      width: '400px',
      height: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The settings dialog was closed', result);
      // Optional: handle the result, apply settings, etc.
    });
  }
}