import { NgFor, NgIf } from '@angular/common';
import { AfterViewInit, Component, HostListener } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { ContextMenuCommandBase } from '../../commands/context-menu.command';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
  selector: 'app-context-menu',
  standalone: true,
  imports: [NgIf, NgFor, MatMenuModule],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent implements AfterViewInit {
  isVisible: boolean = false;
  x: number = 0;
  y: number = 0;
  commands: ContextMenuCommandBase[] = [];
  private mouseLeaveSubject = new Subject<void>();
  private mouseEnterSubject = new Subject<void>();
  private sub!: Subscription;


  constructor(
    private _contextMenuService: ContextMenuService) {
  }

  ngAfterViewInit(): void {
    this._contextMenuService.register(this);
  }

  open(event: MouseEvent, commands: ContextMenuCommandBase[]) {
    if (commands.length == 0) return;
    event.preventDefault();
    this.isVisible = true;
    this.x = event.clientX;
    this.y = event.clientY;
    this.commands.length = 0;
    this.commands.push(...commands);
  }

  execute(event: MouseEvent, command: ContextMenuCommandBase) {
    event.preventDefault();
    command.execute(event);
    this.isVisible = false;
  }


  @HostListener('mouseleave')
  onMouseLeave(): void {
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
  onMouseEnter(): void {
    this.mouseEnterSubject.next();
    this.sub?.unsubscribe();
  }
}
