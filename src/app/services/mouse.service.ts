import { InjectionToken } from "@angular/core";
import { Subject } from "rxjs";

export const SINGLETON_MOUSE_SERVICE_TOKEN = new InjectionToken<MouseService>('SingletonService');
export const SCOPED_MOUSE_SERVICE_TOKEN = new InjectionToken<MouseService>('ScopedService');

export class MouseService {
  private mouseDown = new Subject<MouseEvent>();
  private mouseUp = new Subject<MouseEvent>();
  private mouseMove = new Subject<MouseEvent>();
  private mouseContextMenu = new Subject<MouseEvent>();

  public mouseDown$ = this.mouseDown.asObservable();
  public mouseUp$ = this.mouseUp.asObservable();
  public mouseMove$ = this.mouseMove.asObservable();
  public mouseContextMenu$ = this.mouseContextMenu.asObservable();

  public mouseDownInvoke(event: MouseEvent) {
    this.mouseDown.next(event);
  }

  public mouseUpInvoke(event: MouseEvent) {
    this.mouseUp.next(event);
  }

  public mouseMoveInvoke(event: MouseEvent) {
    this.mouseMove.next(event);
  }

  public mouseContextMenuInvoke(event: MouseEvent) {
    this.mouseContextMenu.next(event);
  }
}