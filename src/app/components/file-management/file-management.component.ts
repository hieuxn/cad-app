import { CommonModule } from '@angular/common';
import { Component, ElementRef, Injector, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeModule } from '@angular/material/tree';
import { Group, ObjectLoader } from 'three';
import { AcceptFilesDirective, supportedExtensions } from '../../directives/accept-file.directive';
import { FileConveterService } from '../../services/file-converter.service';
import { IndexedDbService } from '../../services/indexed-db.service';
import { LayerService } from '../../services/layer.service';
import { MainView3DService } from '../../services/main-view-3d.service';
import { ObjectControlService } from '../../services/object-control.service';
import { ObjectCreationService } from '../../services/object-creation.service';
import { ObjectSelectionService } from '../../services/object-selection.service';
import { SymbolDefinitionService } from '../../services/symbols.service';
import { UserData } from '../../utils/three-object-creation/creators/polyline.creator';
import { Tree, TreeNode } from '../tree/tree.component';

enum Action {

  File = 'Choose File',
  Export = 'Export File',
  Save = 'Save Scene',
  Clear = 'Clear Scene',
  ImportSymbol = 'Import Symbol Definition'
}
const TREE_DATA: TreeNode[] = [
  {
    name: Action.File as string,
    iconClass: "fa-regular fa-folder-open"
  },
  {
    name: Action.Export as string,
    iconClass: "fa-solid fa-file-arrow-down",
    children: [
      { name: 'JSON', iconClass: "fa-regular fa-file" },
      { name: 'DXF', iconClass: "fa-regular fa-file" },
      { name: 'GLB', iconClass: "fa-regular fa-file" },
      { name: 'GLTF', iconClass: "fa-regular fa-file" }],
  },
  {
    name: Action.Save as string,
    iconClass: "fa-regular fa-floppy-disk",
  },
  {
    name: Action.Clear as string,
    iconClass: "fa-solid fa-broom",
  },
  {
    name: Action.ImportSymbol as string,
    iconClass: "fa-solid fa-upload",
  }
];

@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [MatButtonModule, AcceptFilesDirective, CommonModule, FormsModule, MatExpansionModule, MatTreeModule, Tree],
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
  private _objectCreator: ObjectCreationService;
  private _selectionService: ObjectSelectionService;
  private _objectControlService: ObjectControlService;
  private _symbolService: SymbolDefinitionService;
  selectedExtension: supportedExtensions = 'json';
  data: TreeNode[] = TREE_DATA;
  @ViewChild('fileInput') myInputRef!: ElementRef;
  @ViewChild('fileSymbol') fileSymbolRef!: ElementRef;

  constructor(injector: Injector) {
    this._converterService = injector.get(FileConveterService);
    this._snackBar = injector.get(MatSnackBar);
    this._layerService = injector.get(LayerService);
    this._indexedDbService = injector.get(IndexedDbService);
    this._mainViewService = injector.get(MainView3DService);
    this._objectCreator = injector.get(ObjectCreationService);
    this._selectionService = injector.get(ObjectSelectionService);
    this._objectControlService = injector.get(ObjectControlService);
    this._symbolService = injector.get(SymbolDefinitionService);
  }

  async nodeClickedHanlder(node: TreeNode) {
    console.log(node.name);
    switch (node.name as Action) {
      case Action.File:
        this.myInputRef.nativeElement.click();
        break;
      case Action.Save:
        await this.save();
        break;
      case Action.Clear:
        await this.clear();
        break;
      case Action.ImportSymbol:
        this.fileSymbolRef.nativeElement.click();
        break;
      default:
        await this.export(node.name);
        break;
    }
  }

  async importJson(event: Event) {
    function normalizeKeys(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(normalizeKeys);
      } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce((acc, key) => {
          const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
          acc[normalizedKey] = normalizeKeys(obj[key]);
          return acc;
        }, {} as any);
      }
      return obj;
    }

    const fileList = (event.target as HTMLInputElement)?.files as FileList;
    if (!fileList) return;
    const promise = new Promise<UserData>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = event.target?.result;
          const parsed = JSON.parse(json as string);
          const normalized = normalizeKeys(parsed) as UserData;
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(fileList[0]);
    });
    const newSymbol = await promise;
    const uniqueName = this._symbolService.getUniqueName(newSymbol);
    if (this._symbolService.findByName(uniqueName)) return;
    this._symbolService.symbols.push(newSymbol);
  }

  async handleFileInput(event: Event) {
    try {
      const result = await this._converterService.handleFileInput(event);
      if (null === result) return;

      for (const obj of result) {
        const userData = obj.userData
        if (userData && userData['name'] && userData['matrix']) {
          const object = this._objectCreator.reCreateByName(userData['name'], userData);
          object.applyMatrix4(userData['matrix'])
          delete userData['name'];
          delete userData['matrix'];
        }
      }

      this._layerService.activeLayer.addObjects(result);
    }
    catch (error) {
      if (!(error instanceof Error)) return;
      this._snackBar.open(error.message, 'Close', { duration: 3000 });
      return;
    }
  }

  async export(fileExt: string) {
    this._objectControlService.cursor();

    const objects = this._mainViewService.object3Ds.slice(this._mainViewService.defaultChildCount).map(obj => obj.clone());
    objects.forEach(obj => {
      this._layerService.activeLayer.unsetLayer(obj);
      obj.userData['name'] = obj.name;
      obj.userData['matrix'] = obj.matrix;
    });

    const file = await this._converterService.exportToFile(objects, fileExt.toLowerCase());
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
      await this._symbolService.saveData();
      // To revert all selected materials
      this._selectionService.deselectAll(true);

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
      await this._symbolService.clearData();
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
      await this._symbolService.loadData();
    }
    catch (error) {
      console.error('Error loading note:', error);
    }
  }
}
