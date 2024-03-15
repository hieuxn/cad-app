import { NgIf } from '@angular/common';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Group, Object3D, Scene } from 'three';
import { AutofocusDirective } from '../../../directives/auto-focus.directive';
import { TitleSpacingPipe } from '../../../pipes/title-spacing/title-spacing.pipe';
import { LayerService } from '../../../services/layer.service';
import { ObjectCreatorService } from '../../../services/object-creator/object-creator.service';
import { SidebarService } from '../../../services/sidebar.service';

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
export class ObjectInformationComponent implements AfterViewInit {
  private _originalValues: Map<number, any> = new Map<number, any>();
  tableForm!: FormGroup;
  editingIndex: number | null = null;
  private _sidebarService: SidebarService;
  private _formBuilder: FormBuilder
  private _objectCreatorService: ObjectCreatorService;

  get rows(): FormArray {
    return this.tableForm.get('rows') as FormArray;
  }

  constructor(private injector: Injector) {
    this._sidebarService = injector.get(SidebarService);
    this._formBuilder = injector.get(FormBuilder);
    this._objectCreatorService = injector.get(ObjectCreatorService);
    this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
  }

  ngAfterViewInit(): void {
    const sub = this.injector.get(LayerService).activeLayer.objUtils.observable$.subscribe(item => {
      this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
      this._buildForm(item);
      if (this.rows.length > 0) this._sidebarService.selectTab('info', true);
    });
  }

  private _getParent(object: Object3D | null): Object3D | null {
    let parent = object;
    while (!!parent && !(parent.parent instanceof Scene)) {
      parent = parent.parent;
    }
    return parent;
  }

  private _buildForm(object: Object3D): void {
    const obj = this._getParent(object);
    const data = Object.entries(obj?.userData ?? {})
    let index = 1;
    data.forEach(row => {
      if (row[1] instanceof Function || row[1] instanceof Object3D) return;
      this.rows.push(
        this._formBuilder.group({
          id: [index++],
          name: [row[0]],
          value: [row[1]],
          object: obj,
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

  private _reflectNewValue(rowIndex: number) {
    const row = this.rows.at(rowIndex);
    const name = row.get('name')?.value || undefined;
    const value = row.get('value')?.value || undefined;
    const group = row.get('object')?.value as Group || null;
    if (undefined === name || undefined === value || null === group) return;

    group.userData[name] = +value;
    this._objectCreatorService.cylinder.update(group)
  }

  handleKeydown(event: KeyboardEvent, rowIndex: number): void {
    if (event.key === 'Enter') {
      this._stopEdit(rowIndex);
      this._reflectNewValue(rowIndex);
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
    console.log('asd');
  }
}
