import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { ObjectSelectionService } from '../../../shared/services/object-selection.service';
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

let _selectionUtils: ObjectSelectionService;
export function getSelectionUtils(injector: Injector) {
  return _selectionUtils = new ObjectSelectionService(injector);
}