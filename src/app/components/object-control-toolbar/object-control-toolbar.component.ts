import { NgClass } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ThreeViewLifecycleBase } from '../../models/three-view-ready.model';
import { ObjectControlService, Tool } from '../../services/object-control.service';

@Component({
  selector: 'app-object-control-toolbar',
  standalone: true,
  imports: [MatIcon, NgClass],
  templateUrl: './object-control-toolbar.component.html',
  styleUrl: './object-control-toolbar.component.scss'
})
export class ObjectControlToolbarComponent extends ThreeViewLifecycleBase {
  activeTool: Tool = 'cursor'
  private _objectControlService: ObjectControlService;

  constructor(injector: Injector) {
    super(injector);
    this._objectControlService = injector.get(ObjectControlService);
  }

  override afterThreeViewReady() {
    this._objectControlService.init();
  }

  cursor() {
    this._objectControlService.cursor();
    this.activeTool = this._objectControlService.activeTool;
  }

  move() {
    this._objectControlService.move();
    this.activeTool = this._objectControlService.activeTool;
  }

  rotate() {
    this._objectControlService.rotate();
    this.activeTool = this._objectControlService.activeTool;
  }
}