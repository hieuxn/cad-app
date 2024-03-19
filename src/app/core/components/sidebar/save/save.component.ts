import { AfterViewInit, Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Object3D } from 'three';
import { FileConveterService } from '../../../../shared/services/file-converter.service';
import { IndexedDbService } from '../../../../shared/services/indexed-db.service';
import { LayerService } from '../../../../shared/services/layer.service';
import { MainView3DService } from '../../../../shared/services/main-view-3d.service';


@Component({
  selector: 'app-auto-save',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './save.component.html',
  styleUrl: './save.component.scss'
})
export class SaveComponent implements AfterViewInit {
  private _dataId: string = 'threejs';
  private _indexedDbService: IndexedDbService;
  private _mainViewService: MainView3DService
  private _layerService: LayerService
  private _converter: FileConveterService;

  constructor(injector: Injector) {
    this._indexedDbService = injector.get(IndexedDbService);
    this._mainViewService = injector.get(MainView3DService);
    this._layerService = injector.get(LayerService);
    this._converter = injector.get(FileConveterService);
  }
  ngAfterViewInit(): void {
    this.load();
  }

  async save() {
    try {
      const objects: Object3D[] = [];
      this._mainViewService.object3Ds.forEach(obj => {
        if (obj.layers.mask !== 1) objects.push(obj);
      });
      const file = await this._converter.exportToFile(objects, 'dxf');
      await this._indexedDbService.saveData(this._dataId, file);
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
      const file = await this._indexedDbService.getData(this._dataId) as File;
      if (file) {
        const objects = await this._converter.loadFile(file)
        if (null === objects) return;
        // TODO: Does this action needs to clear current scene ???
        this._layerService.activeLayer.addObjects(objects);
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
