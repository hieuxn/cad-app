import { NgIf } from '@angular/common';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ColorPickerModule } from 'ngx-color-picker';
import { Group, Object3D } from 'three';
import { AutofocusDirective } from '../../../../shared/directives/auto-focus.directive';
import { TitleSpacingPipe } from '../../../../shared/pipes/title-spacing/title-spacing.pipe';
import { FamilyCreatorService } from '../../../../shared/services/family-creator/family-creator.service';
import { LayerService } from '../../../../shared/services/layer.service';
import { SidebarService } from '../../../../shared/services/sidebar.service';
import { ThreeObjectCreationService } from '../../../../shared/services/three-object-creation.service';
import { ThreeUtils } from '../../../utils/three.utils';

export interface ObjectData {
  id: number;
  name: string;
  value: any;
}

@Component({
  selector: 'app-object-information',
  standalone: true,
  imports: [MatTableModule, TitleSpacingPipe, MatInputModule, ReactiveFormsModule, NgIf, AutofocusDirective, ColorPickerModule],
  templateUrl: './object-information.component.html',
  styleUrl: './object-information.component.scss'
})
export class ObjectInformationComponent implements AfterViewInit {
  private _originalValues: Map<number, any> = new Map<number, any>();
  tableForm!: FormGroup;
  editingIndex: number | null = null;
  private _sidebarService: SidebarService;
  private _formBuilder: FormBuilder
  private _objectCreatorService: ThreeObjectCreationService;
  private _familyCreatorService: FamilyCreatorService;
  private _threeUtils = new ThreeUtils();

  get rows(): FormArray {
    return this.tableForm.get('rows') as FormArray;
  }

  constructor(private injector: Injector) {
    this._sidebarService = injector.get(SidebarService);
    this._formBuilder = injector.get(FormBuilder);
    this._objectCreatorService = injector.get(ThreeObjectCreationService);
    this._familyCreatorService = injector.get(FamilyCreatorService);
    this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
  }

  ngAfterViewInit(): void {
    const sub = this.injector.get(LayerService).activeLayer.objUtils.observable$.subscribe(item => {
      this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
      this._buildForm(item);
      if (this.rows.length > 0) this._sidebarService.selectTab('info', true);
    });
  }

  private _buildForm(object: Object3D): void {
    const obj = this._threeUtils._getParentGroup(object);
    const data = Object.entries(obj?.userData ?? {})
    let index = 1;
    data.forEach(row => {
      if (row[1] instanceof Function || row[1] instanceof Object3D) return;
      this.rows.push(
        this._formBuilder.group({
          id: [index++],
          name: [row[0]],
          value: [row[0] === 'color' ? '#' + row[1] : row[1]],
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

  // format(row: AbstractControl<any, any>) {
  //   return row.get('name')?.value === 'color' ? '#' + row.get('value')?.value.toString(16) : row.get('value')?.value;
  // }

  private _stopEdit(rowIndex: number): void {
    this.editingIndex = null;
    this._originalValues.delete(rowIndex);
  }

  private _reflectNewValue(rowIndex: number) {
    const row = this.rows.at(rowIndex);
    const name = row.get('name')?.value || undefined;
    let value = row.get('value')?.value || undefined;
    const group = row.get('object')?.value as Group || null;
    if (undefined === name || undefined === value || null === group) return;

    const parent = this._threeUtils._getParentGroup(group);

    const parsed = parseFloat(value);
    value = isNaN(parsed) ? value : parsed;

    if (parent && parent !== group) {
      const currentInstances = parent.children.filter((o): o is Group => !!o);
      const familyTemplate = this._familyCreatorService.familyMap.get(parent.uuid) as Group;
      if (familyTemplate) currentInstances.push(familyTemplate);

      for (const familyInstances of currentInstances) {
        familyInstances.userData[name] = value;
        this._objectCreatorService.cylinder.update(familyInstances)
      }
    }
    else {
      group.userData[name] = value;
      this._objectCreatorService.cylinder.update(group)
    }
  }


  handleKeydown(event: KeyboardEvent, rowIndex: number): void {
    if (event.key === 'Enter') {
      this._stopEdit(rowIndex);
      this._reflectNewValue(rowIndex);
    } else if (event.key === 'Escape') {
      this.cancelEdit(rowIndex);
    }
  }

  colorPickerChange(rowIndex: number) {
    this._stopEdit(rowIndex);
    this._reflectNewValue(rowIndex);
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
