import { CommonModule } from '@angular/common';
import { Component, Inject, Injector } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Object3D } from 'three';
import { SymbolDefinitionService } from '../../services/symbols.service';
import { Parameter, UserData } from '../../utils/three-object-creation/creators/polyline.creator';


@Component({
  selector: 'app-user-data-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-data-editor.component.html',
  styleUrl: './user-data-editor.component.scss'
})
export class UserDataEditorComponent {
  userData: UserData = { familyCategory: "", familyName: "", familySymbolName: "", parameters: [] };
  object: Object3D | null = null;
  instanceParameters: Parameter[] = []
  typeParameters: Parameter[] = []
  objects: UserData[] = [];
  private _symbolService: SymbolDefinitionService;

  onSelectObject(event: Event): void {
    function removeUserDataProps(instance: UserData): void {
      const userDataKeys: Array<keyof UserData> = [
        "familyCategory",
        "familyName",
        "familySymbolName",
        "parameters"
      ];

      userDataKeys.forEach(key => {
        delete instance[key];
      });
    }

    const deepClone = <T>(obj: T): T => {
      return JSON.parse(JSON.stringify(obj));
    };

    const selectElement = event.target as HTMLSelectElement;
    if (this.object) {
      const selectedData = this._symbolService.findByName(selectElement.value);
      if (selectedData) {
        this.userData = selectedData;
        selectedData.parameters = selectedData.parameters.map(p => {
          if (p.isInstance) {
            const newP = deepClone(p);
            newP.value = '';
            return newP;
          }
          return p;
        })
        removeUserDataProps(this.object.userData as UserData);
        this.object.userData = { ...this.object.userData, ...this.userData }
        this.dialogRef.close();
      }
    }
  }
  constructor(public dialogRef: MatDialogRef<UserDataEditorComponent>, @Inject(MAT_DIALOG_DATA) public data: { object: Object3D }, injector: Injector) {
    this._symbolService = injector.get(SymbolDefinitionService);
    this.object = data.object;
    this.userData = data.object.userData as UserData;
    this.objects.push(this.userData);
    const uniqueName = this.getUniqueName(this.userData);
    this._symbolService.symbols.forEach(s => {
      if (this.getUniqueName(s) !== uniqueName) this.objects.push(s);
    });



    this.instanceParameters = this.userData.parameters.filter(p => p.isInstance);

    this.typeParameters = this.userData.parameters.filter(p => !p.isInstance);
  }

  getUniqueName(obj: UserData): string {
    return this._symbolService.getUniqueName(obj);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  handleInputChange(event: any, key: string): void {
    if (null === this.userData) return;
    if (key in this.userData) {
      (this.userData as any)[key] = (event.target.value as string) || '';
    }
  }

  handleParameterChange(index: number, event: any, key: string, isInstance: boolean): void {
    if (null === this.userData) return;
    if (key in this.userData.parameters[index]) {
      ((isInstance ? this.instanceParameters : this.typeParameters)[index] as any)[key] = typeof event === 'string' ? event : event.currentTarget.checked;
    }
  }

  addParameter(): void {
    if (null === this.userData) return;
    const name = this.userData.parameters.length === 0 ? 'New Parameter' : `New Parameter (${this.userData.parameters.length})`;
    this.userData.parameters.push({ name: name, type: 'Text', group: 'Text', isInstance: true, value: '' });
  }

  deleteParameter(index: number): void {
    if (null === this.userData) return;
    this.userData.parameters.splice(index, 1);
  }
}
