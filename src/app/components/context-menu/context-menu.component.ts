import { NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ContextMenuCommandBase } from './commands/context-menu-command-base';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent {
  public isVisible: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public commands: ContextMenuCommandBase[] = [];

  public open(event: MouseEvent, commands: ContextMenuCommandBase[]) {
    if (commands.length == 0) return;
    event.preventDefault();
    this.isVisible = true;
    this.x = event.clientX;
    this.y = event.clientY;
    this.commands.length = 0;
    this.commands.push(...commands);
  }

  public execute(event: MouseEvent, command: ContextMenuCommandBase) {
    event.preventDefault();
    command.execute(event);
    this.isVisible = false;
  }
}
