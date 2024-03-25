import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DrawCylinderCommand } from '../../commands/draw-cylinder.command';
import { DrawHBeamCommand } from '../../commands/draw-h-beam.command';
import { DrawPolyLineCommand } from '../../commands/draw-polyline.command';
import { MousePlacementCommand } from '../../commands/mouse-placement.command';
import { CommandManagerService } from '../../services/command-manager.service';
import { LayerService } from '../../services/layer.service';

@Component({
  selector: 'app-drawing-toolbar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './drawing-toolbar.component.html',
  styleUrl: './drawing-toolbar.component.scss'
})
export class DrawingToolbarComponent {
  commands!: MousePlacementCommand[];
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
    polyline.userData['blockName'] = `${family}-${familyName}-${materialId}-${structuralLayerName}`;

    const cylinder = new DrawCylinderCommand(injector);
    // cylinder.userData['blockName'] = 'My Cylinder Family';

    const hbeam = new DrawHBeamCommand(injector);
    // hbeam.userData['blockName'] = 'My HBeam Family';

    this.commands = [polyline, cylinder, hbeam];
  }

  execute(drawingCommand: MousePlacementCommand) {
    this._currentCommand?.cancel();
    const layer = this._layerService.activeLayer;
    if (layer) {
      drawingCommand.execute();
    }
    this._currentCommand = drawingCommand;
  }
}
