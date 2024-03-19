import { Injectable, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Observable, Subject } from "rxjs";
import { Group, Object3D } from "three";
import { FamilyCreatorDialogComponent } from "../../../core/components/sidebar/family-creator-pane/family-creator-dialog/family-creator-dialog.component";

@Injectable({ providedIn: 'root' })
export class FamilyCreatorService {
  private _dialog: MatDialog = inject(MatDialog);
  private _groupSubject: Subject<Group> = new Subject<Group>();
  
  familyMap = new Map<string, Group>();
  groups: Observable<Group> = this._groupSubject.asObservable();

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
        this._groupSubject.next(parentGroup);
      }
    });
  }
}