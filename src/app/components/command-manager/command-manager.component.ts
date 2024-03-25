import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CommandManagerService } from '../../services/command-manager.service';

@Component({
  selector: 'app-command-manager',
  standalone: true,
  imports: [MatExpansionModule, MatListModule, MatButton, MatIcon, MatMenuModule],
  templateUrl: './command-manager.component.html',
  styleUrl: './command-manager.component.scss'
})
export class CommandManagerComponent {
  undoStack = this._commandService.undoStack;
  redoStack = this._commandService.redoStack;
  constructor(private _commandService: CommandManagerService) {
  }

  undo() {
    this._commandService.undo();
  }

  redo() {
    this._commandService.redo();
  }

  undoToIndex(i: number) {
    for (let index = 0; index <= i; ++index) {
      this.undo();
    }
  }

  redoToIndex(i: number) {
    for (let index = 0; index <= i; ++index) {
      this.redo();
    }
  }
}
