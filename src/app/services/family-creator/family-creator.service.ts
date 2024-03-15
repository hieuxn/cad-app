import { Injectable, inject } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Group, Object3D } from "three";
import { FamilyCreatorDialogComponent } from "../../components/sidebar/family-creator-pane/family-creator-dialog/family-creator-dialog.component";

@Injectable({ providedIn: 'root' })
export class FamilyCreatorService {
  dialog: MatDialog = inject(MatDialog);
  groups: Group[] = [];

  openFamilyCreatorDialog(objects: Object3D[]): void {
    const dialogRef = this.dialog.open(FamilyCreatorDialogComponent, {
      width: '250px',
      data: objects
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && 'group' in result && result.group instanceof Group) this.groups.push(result.group);
    });
  }
}