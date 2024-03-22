import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ObjectSnappingUtils } from '../../utils/object-snapping.utils';
import { ObjectControlToolbarComponent } from './object-control-toolbar.component';



@NgModule({
  declarations: [],
  imports: [
    CommonModule, ObjectControlToolbarComponent
  ],
  exports: [ObjectControlToolbarComponent]
})

export class ObjectControlToolbarModule { }

let snappingUtils = new ObjectSnappingUtils();
export function getSnappingUtils() {
  return snappingUtils;
}