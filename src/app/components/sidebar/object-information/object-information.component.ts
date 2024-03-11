import { NgIf } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AutofocusDirective } from '../../../directives/auto-focus.directive';
import { TitleSpacingPipe } from '../../../pipes/title-spacing/title-spacing.pipe';

export interface ObjectData {
  id: number;
  name: string;
  value: any;
}

@Component({
  selector: 'app-object-information',
  standalone: true,
  imports: [MatTableModule, TitleSpacingPipe, MatInputModule, ReactiveFormsModule, NgIf, AutofocusDirective],
  templateUrl: './object-information.component.html',
  styleUrl: './object-information.component.scss'
})
export class ObjectInformationComponent implements OnChanges {
  private _originalValues: Map<number, any> = new Map<number, any>();
  @Input() data: any[] = [];
  tableForm!: FormGroup;
  editingIndex: number | null = null;

  get rows(): FormArray {
    return this.tableForm.get('rows') as FormArray;
  }

  constructor(private _formBuilder: FormBuilder) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
      this._buildForm();
    }
  }

  private _buildForm(): void {
    const data = Object.entries(this.data.length > 0 ? this.data.at(-1) : {});
    let index = 1;
    data.forEach(row => {
      this.rows.push(
        this._formBuilder.group({
          id: [index++],
          name: [row[0]],
          value: [row[1]]
        })
      );
    });
    this.rows.markAllAsTouched();
  }

  startEdit(rowIndex: number, value: any): void {
    this.editingIndex = rowIndex;
    this._originalValues.set(rowIndex, value);
  }

  private _stopEdit(rowIndex: number): void {
    this.editingIndex = null;
    this._originalValues.delete(rowIndex);
  }

  handleKeydown(event: KeyboardEvent, rowIndex: number): void {
    if (event.key === 'Enter') {
      this._stopEdit(rowIndex);
    } else if (event.key === 'Escape') {
      this.cancelEdit(rowIndex);
    }
  }

  cancelEdit(rowIndex: number): void {
    if (this._originalValues.has(rowIndex)) {
      const originalValue = this._originalValues.get(rowIndex);
      const row = this.rows.at(rowIndex);
      row.get('value')?.setValue(originalValue);
    }
    this._stopEdit(rowIndex)
  }
}
