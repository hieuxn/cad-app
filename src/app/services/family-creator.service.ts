import { Injectable, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable, Subject } from "rxjs";
import { Group, Object3D } from "three";
import { FamilyCreatorDialogComponent } from "../components/family-dialog/family-creator-dialog.component";

@Injectable({ providedIn: 'root' })
export class FamilyCreatorService {
  private _dialog: MatDialog = inject(MatDialog);
  private _familyTemplateSubject: Subject<Group> = new Subject<Group>();
  
  familyMap = new Map<string, Group>();
  familyTemplate$: Observable<Group> = this._familyTemplateSubject.asObservable();

  constructor() {
  }

  openFamilyCreatorDialog(objects: Object3D[]): void {
    const dialogRef = this._dialog.open(FamilyCreatorDialogComponent, {
      width: '250px',
      data: objects
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && 'group' in result && result.group instanceof Group) {
        const parentGroup = new Group();
        parentGroup.name = `Family: ${result.group.name}`;
        parentGroup.add(result.group);
        this._familyTemplateSubject.next(parentGroup);
      }
    });
  }
}