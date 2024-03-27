import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Group, ObjectLoader } from 'three';
import { AcceptFilesDirective } from '../../directives/accept-file.directive';
import { FileConveterService } from '../../services/file-converter.service';
import { IndexedDbService } from '../../services/indexed-db.service';
import { LayerService } from '../../services/layer.service';
import { MainView3DService } from '../../services/main-view-3d.service';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { ThreeObjectCreationService } from '../../services/three-object-creation.service';

@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [MatButtonModule, AcceptFilesDirective],
  templateUrl: './file-management.component.html',
  styleUrl: './file-management.component.scss'
})
export class FileManagementComponent {
  private _converterService: FileConveterService;
  private _snackBar: MatSnackBar;
  private _mainViewService: MainView3DService;
  private _layerService: LayerService;
  private _dataId: string = 'threejs';
  private _indexedDbService: IndexedDbService;
  private _objectCreator: ThreeObjectCreationService;
	private _selectionService: ObjectSelectionService;


  constructor(injector: Injector) {
    this._converterService = injector.get(FileConveterService);
    this._snackBar = injector.get(MatSnackBar);
    this._layerService = injector.get(LayerService);
    this._indexedDbService = injector.get(IndexedDbService);
    this._mainViewService = injector.get(MainView3DService);
    this._objectCreator = injector.get(ThreeObjectCreationService);
    this._selectionService = injector.get(ObjectSelectionService);
  }

  async handleFileInput(event: Event) {
    try {
      const result = await this._converterService.handleFileInput(event);
      if (null === result) return;
      this._layerService.activeLayer.addObjects(result);
    }
    catch (error) {
      if (!(error instanceof Error)) return;
      this._snackBar.open(error.message, 'Close', { duration: 3000 });
      return;
    }
  }

  async export() {
    // TODO: get necessary objects to export
    const fileExt = 'glb';
    const objects = this._mainViewService.object3Ds.slice(1);
    const file = await this._converterService.exportToFile(objects, fileExt);
    if (null === file) return;
    const blob = new Blob([await file.text()], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'export.' + fileExt;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  ngAfterViewInit(): void {
    this.load();
  }

  async save() {
    try {
      // To revert all selected materials
      this._selectionService.deselectAll();
      
      const objects: any[] = [];
      this._mainViewService.object3Ds.slice(this._mainViewService.defaultChildCount).forEach(obj => {
        if (obj instanceof Group && Object.keys(obj.userData).length > 0) {
          obj.userData['name'] = obj.name;
          obj.userData['matrix'] = obj.matrix;
          objects.push(obj.userData);
        }
        else {
          this._layerService.activeLayer.unsetLayer(obj);
          const json = obj.toJSON();
          objects.push(json);
        }
      });
      await this._indexedDbService.saveData(this._dataId, objects);
      console.log('Data saved successfully!');
    }
    catch (error) {
      console.error('Error saving note:', error);
    }
  }

  async clear() {
    try {
      await this._indexedDbService.saveData(this._dataId, [])
      this._layerService.layers.forEach(layer => layer.clear());
      console.log('Data saved successfully!');
    }
    catch (error) {
      console.error('Error saving note:', error);
    }
  }

  async load() {
    try {
      const objectLoader = new ObjectLoader();
      const userDatas = await this._indexedDbService.getData(this._dataId);
      if (userDatas) {
        for (const userData of userDatas) {
          if (userData && userData['name'] && userData['matrix']) {
            const object = this._objectCreator.reCreateByName(userData['name'], userData);
            object.applyMatrix4(userData['matrix'])
            delete userData['name'];
            delete userData['matrix'];
            this._layerService.activeLayer.addObjects(object);
          }
          else {
            const object = objectLoader.parse(userData);
            this._layerService.activeLayer.addObjects(object);
          }
        }
      }
      else {
        this._layerService.activeLayer.clear();
      }
    }
    catch (error) {
      console.error('Error loading note:', error);
    }
  }
}
