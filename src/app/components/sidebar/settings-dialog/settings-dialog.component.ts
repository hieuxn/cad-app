import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { Constants } from '../../../models/constants.model';
import { SettingsService } from '../../../services/settings.service';

@Component({
  selector: 'app-settings-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatSliderModule, MatButtonModule],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss'
})
export class SettingsDialogComponent {
  readonly snapPrecision: string = Constants.Settings.SnapPrecisionProperty;
  readonly decimalPlaces: string = Constants.Settings.DecimalPlacesProperty;
  settings: any = {}

  constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>,
    private settingsService: SettingsService
  ) {
    Object.values(Constants.Settings).forEach(key => {
      const value = this.settingsService.get(key);
      if (value !== null && value !== undefined) {
        this.settings[key] = value;
      }
    });
  }

  formatLabel(value: number): string {
    return `${1 / Math.pow(10, value)}`
  }

  saveSettings(): void {
    Object.keys(this.settings).forEach(key => {
      const value = this.settings[key];
      if (value !== null && value !== undefined) {
        this.settingsService.set(key, value);
      }
    });
    this.dialogRef.close(this.settingsService);
  }
}
