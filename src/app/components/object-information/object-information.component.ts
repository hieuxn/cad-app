import { CommonModule, NgIf } from '@angular/common';
import { AfterViewInit, Component, Injector } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ColorPickerModule } from 'ngx-color-picker';
import { Group, Object3D, Vector3, Vector3Like } from 'three';
import { CommandActionBase } from '../../commands/mouse-placement.command';
import { AutofocusDirective } from '../../directives/auto-focus.directive';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { TitleSpacingPipe } from '../../pipes/title-spacing.pipe';
import { CommandManagerService } from '../../services/command-manager.service';
import { FamilyCreatorService } from '../../services/family-creator.service';
import { LayerService } from '../../services/layer.service';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { SidebarService } from '../../services/sidebar.service';
import { ThreeObjectCreationService } from '../../services/three-object-creation.service';
import { ThreeUtils } from '../../utils/three.utils';

export interface ObjectData {
  id: number;
  name: string;
  value: any;
}

@Component({
  selector: 'app-object-information',
  standalone: true,
  imports: [MatTableModule, TitleSpacingPipe, MatInputModule, ReactiveFormsModule, NgIf, AutofocusDirective,
    ColorPickerModule, FormsModule, CommonModule, ClickOutsideDirective],
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
  private _selectionService: ObjectSelectionService;
  private _layerService: LayerService;
  private _commandService: CommandManagerService;

  get rows(): FormArray {
    return this.tableForm.get('rows') as FormArray;
  }

  constructor(private injector: Injector) {
    this._sidebarService = injector.get(SidebarService);
    this._formBuilder = injector.get(FormBuilder);
    this._objectCreatorService = injector.get(ThreeObjectCreationService);
    this._familyCreatorService = injector.get(FamilyCreatorService);
    this._selectionService = injector.get(ObjectSelectionService);
    this._layerService = injector.get(LayerService);
    this._commandService = injector.get(CommandManagerService);
    this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
  }

  ngAfterViewInit(): void {
    const sub = this._selectionService.observable$.subscribe(item => {
      this.tableForm = this._formBuilder.group({ rows: this._formBuilder.array([]) });
      this._buildForm(item);
      if (this.rows.length > 0) this._sidebarService.selectTab('info', true);
    });
  }

  private _buildForm(object: Object3D): void {
    const obj = this._threeUtils.getParentGroup(object);
    const data = Object.entries(obj?.userData ?? {})
    let index = 1;
    data.forEach(row => {
      if (this.isVector(row[1])) {
        this.rows.push(
          this._formBuilder.group({
            id: [index++],
            name: [row[0]],
            type: 'vector',
            value: this._formBuilder.array((row[1] as Vector3Like[]).map(vec => this._formBuilder.group(vec))),
            object: obj,
          })
        );
      }
      else {
        this.rows.push(
          this._formBuilder.group({
            id: [index++],
            name: [row[0]],
            type: typeof row[1],
            value: [row[0] === 'color' ? this._toColorFormat(row[1]) : row[1]],
            object: obj,
          })
        );
      }
    });

    this.rows.markAllAsTouched();
  }

  private _toColorFormat(color: number | string): string {
    if (typeof color === 'number') {
      return `#${color.toString(16)}`;
    }
    return color;
  }

  isVector(value: any): boolean {
    return Array.isArray(value) && value.length > 0 && value[0].hasOwnProperty('x') && value[0].hasOwnProperty('y') && value[0].hasOwnProperty('z');
  }

  toString(value: Vector3) {
    return `(${value.x}, ${value.y}, ${value.z})`;
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
    if (!row) return;
    const name = row.get('name')?.value || undefined;
    let value = row.get('value')?.value || undefined;
    const group = row.get('object')?.value as Group || null;
    if (undefined === name || undefined === value || null === group) return;

    // const parent = this._threeUtils.getParentGroup(group);

    const parsed = parseFloat(value);
    value = isNaN(parsed) ? value : parsed;

    // if (parent && parent !== group) {
    //   const currentInstances = parent.children.filter((o): o is Group => !!o);
    //   const familyTemplate = this._familyCreatorService.familyMap.get(parent.uuid) as Group;
    //   if (familyTemplate) currentInstances.push(familyTemplate);

    //   for (const familyInstances of currentInstances) {
    //     familyInstances.userData[name] = value;
    //     this._objectCreatorService.reCreate(familyInstances)
    //   }
    // }
    // else {
    group.userData[name] = value;
    const newGroup = this._objectCreatorService.reCreate(group)
    newGroup.applyMatrix4(group.matrix)
    this._layerService.activeLayer.removeObjects(group);
    this._layerService.activeLayer.addObjects(newGroup);
    console.log('Edit');
    this.rows.clear();

    this._commandService.addCommand(new CommandActionBase(`Update Object: ${name}`, () => {
      this._layerService.activeLayer.removeObjects(group);
      this._layerService.activeLayer.addObjects(newGroup);
      this.rows.clear();
    }, () => {
      this._layerService.activeLayer.removeObjects(newGroup);
      this._layerService.activeLayer.addObjects(group);
      this.rows.clear();
    }));
    // }
  }


  handleKeydown(event: KeyboardEvent, rowIndex: number): void {
    if (event.key === 'Enter') {
      this._stopEdit(rowIndex);
      this._reflectNewValue(rowIndex);
    } else if (event.key === 'Escape') {
      this.cancelEdit(rowIndex);
    }
  }

  changed: boolean = false;
  onChange(rowIndex: number): void {
    if (!this.changed) return;
    this._stopEdit(rowIndex);
    this._reflectNewValue(rowIndex);
    this.changed = false;
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
  }
}
