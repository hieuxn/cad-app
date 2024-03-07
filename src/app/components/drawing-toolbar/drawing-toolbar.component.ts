import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LayerService } from '../../services/layer.service';
import { DrawingCommand } from './commands/drawing-command';
import { DrawingPolyLineCommand } from './commands/drawing-polyline';

@Component({
  selector: 'app-drawing-toolbar',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './drawing-toolbar.component.html',
  styleUrl: './drawing-toolbar.component.scss'
})
export class DrawingToolbarComponent {
  public commands!: DrawingCommand[];
  private currentCommand: DrawingCommand | null = null;
  private layerService: LayerService;

  constructor(injector: Injector) {
    this.layerService = injector.get(LayerService);

    const family = 'Wale Family';
    let familyName = 'Wale base';
    const materialId = 12345;
    const layerName = 'default layer';

    const polyline = new DrawingPolyLineCommand(injector);
    polyline.name = `Draw polyline (${familyName})`;
    polyline.userData['commnent'] = familyName
    polyline.userData['blockName'] = `${family}-${familyName}-${materialId}-${layerName}`;

    familyName = 'Center of wale base';
    const polyline2 = new DrawingPolyLineCommand(injector);
    polyline2.name = `Draw polyline (${familyName})`;
    polyline2.color = 0xFFFF00;
    polyline2.userData['commnent'] = familyName
    polyline2.userData['blockName'] = `${family}-${familyName}-${materialId}-${layerName}`;

    this.commands = [polyline, polyline2];
  }

  public execute(drawingCommand: DrawingCommand) {
    this.currentCommand?.cancel();
    const layer = this.layerService.activeLayer;
    if (layer) {
      drawingCommand.execute(layer);
    }
    this.currentCommand = drawingCommand;
  }
}
