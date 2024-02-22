import { Component, Injector } from '@angular/core';
import { LayerService } from '../../services/layer.service';
import { DrawingCommand } from './commands/drawing-command';
import { DrawingPolyLineCommand } from './commands/drawing-polyline';

@Component({
  selector: 'app-drawing-toolbar',
  standalone: true,
  imports: [],
  templateUrl: './drawing-toolbar.component.html',
  styleUrl: './drawing-toolbar.component.scss'
})
export class DrawingToolbarComponent {
  public commands!: DrawingCommand[];
  private currentCommand: DrawingCommand | null = null;
  constructor(
    private layerService: LayerService,
    injector: Injector) {
    // const rectangle = injector.get(DrawingRectangleCommand);
    // const ellipse = injector.get(DrawingEllipseCommand);
    const polyline = injector.get(DrawingPolyLineCommand);
    this.commands = [polyline];
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
