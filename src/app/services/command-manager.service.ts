import { Injectable } from "@angular/core";
import { CommandBase } from "../commands/mouse-placement.command";

@Injectable({ providedIn: 'root' })
export class CommandManagerService {
  undoStack: CommandBase[] = [];
  redoStack: CommandBase[] = [];

  constructor() {
  }

  executeCommand(command: CommandBase) {
    command.execute();
    this.addCommand(command);
  }

  addCommand(command: CommandBase) {
    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }
}
