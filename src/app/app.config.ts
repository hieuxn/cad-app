import { ApplicationConfig, Injector } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MouseService, SCOPED_MOUSE_SERVICE_TOKEN, SINGLETON_MOUSE_SERVICE_TOKEN } from './services/mouse.service';
export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    { provide: SINGLETON_MOUSE_SERVICE_TOKEN, useClass: MouseService },
    { provide: SCOPED_MOUSE_SERVICE_TOKEN, useFactory: (injector: Injector) => () => injector.get(MouseService), deps: [Injector] },
  ],
};
