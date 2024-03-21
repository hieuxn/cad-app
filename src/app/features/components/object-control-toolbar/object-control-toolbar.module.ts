import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ObjectControlToolbarComponent } from './object-control-toolbar/object-control-toolbar.component';
import { ObjectSnappingUtils } from './utils/object-snapping.utils';



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