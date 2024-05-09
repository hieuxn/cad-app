import { Component, Injector } from '@angular/core';
import { DrawCylinderCommand } from '../../commands/draw-cylinder.command';
import { DrawHBeamCommand } from '../../commands/draw-h-beam.command';
import { DrawPolyLineCommand } from '../../commands/draw-polyline.command';
import { MousePlacementCommand } from '../../commands/mouse-placement.command';
import { CommandManagerService } from '../../services/command-manager.service';
import { LayerService } from '../../services/layer.service';
import { Tree, TreeNode } from '../tree/tree.component';

@Component({
  selector: 'app-drawing-toolbar',
  standalone: true,
  imports: [Tree],
  templateUrl: './drawing-toolbar.component.html',
  styleUrl: './drawing-toolbar.component.scss'
})
export class DrawingToolbarComponent {
  data: TreeNode[];
  // commands!: MousePlacementCommand[];
  private _currentCommand: MousePlacementCommand | null = null;
  private _layerService: LayerService;
  private _commandSerivce: CommandManagerService;

  constructor(injector: Injector) {
    this._layerService = injector.get(LayerService);
    this._commandSerivce = injector.get(CommandManagerService);

    const family = 'Wale Family';
    const familyName = 'Center of wale base';
    const materialId = 12345;
    const structuralLayerName = 'default layer';

    const polyline = new DrawPolyLineCommand(injector);
    polyline.name = `Polyline`;
    polyline.color = 0xFFFF00;
    // polyline.userData['blockName'] = `${family}-${familyName}-${materialId}-${structuralLayerName}`;

    const cylinder = new DrawCylinderCommand(injector);
    // cylinder.userData['blockName'] = 'My Cylinder Family';

    const hbeam = new DrawHBeamCommand(injector);
    // hbeam.userData['blockName'] = 'My HBeam Family';

    // this.commands = [polyline, cylinder, hbeam];
    this.data = [
      { name: 'Polyline', data: polyline, },
      { name: 'Cylinder', data: cylinder, },
      { name: 'H-Beam', data: hbeam }];
  }

  execute(drawingCommand: MousePlacementCommand) {
    this._currentCommand?.cancel();
    const layer = this._layerService.activeLayer;
    if (layer) {
      drawingCommand.execute();
    }
    this._currentCommand = drawingCommand;
  }

  nodeClick(node: TreeNode) {
    this.execute(node.data);
  }
}
