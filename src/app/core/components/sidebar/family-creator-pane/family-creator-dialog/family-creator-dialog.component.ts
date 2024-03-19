import { Component, Inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { Group, Object3D } from 'three';
import { ThreeUtils } from '../../../../utils/three.utils';
@Component({
  selector: 'app-family-creator-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatSliderModule, MatButtonModule, ReactiveFormsModule],
  templateUrl: './family-creator-dialog.component.html',
  styleUrl: './family-creator-dialog.component.scss'
})
export class FamilyCreatorDialogComponent {

  namingForm = this._fb.group({
    familyName: ['', Validators.required],
    group: {}
  });
  private _threeUtils = new ThreeUtils();

  constructor(@Inject(MAT_DIALOG_DATA) private objects: Object3D[],
    private _fb: FormBuilder) {
  }

  onSubmit(): void {
    const name = this.namingForm.value.familyName;
    if (!name) return;
    const group = new Group();
    group.name = name;
    this.objects.forEach(obj => {
      const parent = this._threeUtils._getParentGroup(obj);
      if (!parent) return;

      group.userData = { ...parent.userData, ...group.userData };

      const clone = parent.clone();
      clone.children.forEach(c => c.position.sub(obj.position));
      group.add(...clone.children);
      parent.clear();
    })
    this.namingForm.value.group = group;
  }


  private _deepClone(object: Object3D): Object3D {
    return object;
  }
}
