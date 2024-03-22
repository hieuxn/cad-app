import { InjectionToken } from "@angular/core";
import { Subject } from "rxjs";

export const SINGLETON_MOUSE_SERVICE_TOKEN = new InjectionToken<MouseService>('SingletonService');
export const SCOPED_MOUSE_SERVICE_TOKEN = new InjectionToken<MouseService>('ScopedService');

export class MouseService {
  private _mouseDown = new Subject<MouseEvent>();
  private _mouseUp = new Subject<MouseEvent>();
  private _mouseMove = new Subject<MouseEvent>();
  private _mouseContextMenu = new Subject<MouseEvent>();
  private _wheel = new Subject<MouseEvent>();

  mouseDown$ = this._mouseDown.asObservable();
  mouseUp$ = this._mouseUp.asObservable();
  mouseMove$ = this._mouseMove.asObservable();
  mouseContextMenu$ = this._mouseContextMenu.asObservable();
  wheel$ = this._wheel.asObservable();

  mouseDownInvoke(event: MouseEvent) {
    this._mouseDown.next(event);
  }

  mouseUpInvoke(event: MouseEvent) {
    this._mouseUp.next(event);
  }

  mouseMoveInvoke(event: MouseEvent) {
    this._mouseMove.next(event);
  }

  mouseContextMenuInvoke(event: MouseEvent) {
    this._mouseContextMenu.next(event);
  }

  wheel(event: MouseEvent) {
    this._wheel.next(event);
  }
}