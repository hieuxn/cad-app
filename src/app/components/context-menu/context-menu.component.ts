import { NgFor, NgIf } from '@angular/common';
import { Component, HostListener, NgZone } from '@angular/core';
import { Subject, Subscription, debounceTime } from 'rxjs';
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
  private mouseLeaveSubject = new Subject<void>();
  private mouseEnterSubject = new Subject<void>();
  private sub!: Subscription;


  public constructor(ngZone: NgZone) {
  }

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


  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.sub?.unsubscribe();
    this.sub = this.mouseLeaveSubject.pipe(
      debounceTime(300),
    ).subscribe({
      next: () => {
        this.isVisible = false;
      }
    });
    this.mouseLeaveSubject.next();
  }

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    this.mouseEnterSubject.next();
    this.sub?.unsubscribe();
  }
}
