import { Injector } from "@angular/core";
import { Subscription } from "rxjs";
import { MainView3DService } from "../services/main-view-3d.service";


export abstract class ThreeViewLifecycleBase {
  protected mainView3DService: MainView3DService;
  protected subscription = new Subscription();

  constructor(protected injector: Injector) {
    this.mainView3DService = injector.get(MainView3DService);

    let sub = this.mainView3DService.viewReady$.subscribe(this.afterThreeViewReady.bind(this));
    this.subscription.add(sub);

    sub = this.mainView3DService.destroy$.subscribe(this.dispose.bind(this));
    this.subscription.add(sub);
  }

  protected dispose(): void {
    this.subscription.unsubscribe();
  }

  protected afterThreeViewReady(afterThreeViewReady: MainView3DService) {
  }
}