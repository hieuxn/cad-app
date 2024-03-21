import { KeyValue } from '@angular/common';
import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Group, Vector3 } from 'three';
import { ReactiveMousePlacementCommand } from '../../../../shared/commands/reactive-mouse-placement.command';
import { AcceptFilesDirective } from '../../../../shared/directives/accept-file.directive';
import { FamilyCreatorService } from '../../../../shared/services/family-creator/family-creator.service';
import { FileConveterService } from '../../../../shared/services/file-converter.service';
import { LayerService } from '../../../../shared/services/layer.service';
import { MainView3DService } from '../../../../shared/services/main-view-3d.service';
import { ThreeViewLifecycleBase } from '../../../models/three-view-ready.model';

@Component({
  selector: 'app-family-creator-pane',
  standalone: true,
  imports: [MatButtonModule, AcceptFilesDirective],
  templateUrl: './family-pane.component.html',
  styleUrl: './family-pane.component.scss'
})
export class FamilyCreatorPaneComponent extends ThreeViewLifecycleBase {
  private _familyCreatorService!: FamilyCreatorService;
  private _layerService!: LayerService;
  private _command!: ReactiveMousePlacementCommand;
  private _converterService!: FileConveterService;
  private _commandSubscription!: Subscription;
  private _subscription: Subscription = new Subscription();;
  private _currentFamilyInfo!: KeyValue<string, Group>;
  private _clone!: Group;
  familyMap!: Map<string, Group>;

  constructor(injector: Injector) {
    super(injector);
  }

  protected override afterThreeViewReady(afterThreeViewReady: MainView3DService) {
    this._familyCreatorService = this.injector.get(FamilyCreatorService)
    this.familyMap = this._familyCreatorService.familyMap;

    this._layerService = this.injector.get(LayerService);
    this._converterService = this.injector.get(FileConveterService);

    const sub = this._familyCreatorService.familyTemplate$.subscribe(familyTemplate => {
      const family = familyTemplate.children[0] as Group;
      this.familyMap.set(familyTemplate.uuid, family);

      familyTemplate.clear();
      this._layerService.activeLayer.addObjects(familyTemplate);
    });
    this._subscription.add(sub);

    this._command = new ReactiveMousePlacementCommand('Place family', true, this.injector);
  }

  execute([key, value]: [string, Group]) {
    this._currentFamilyInfo = { key: key, value: value };
    this._clone = value.clone();
    this._clone.userData = { ...value.userData };

    if (this._commandSubscription) this._commandSubscription.unsubscribe();
    this._commandSubscription = this._command.source$.subscribe(this._place.bind(this));
    this._command.execute();
  }

  private _place([destSubject, positions]: [BehaviorSubject<KeyValue<string, Group>>, Vector3[]]) {
    if (positions.length === 0) return;

    this._clone.position.copy(positions.at(-1)!);

    destSubject.next({ key: this._currentFamilyInfo.key, value: this._clone });
  }

  async importFamily(event: Event) {
    const objects = await this._converterService.handleFileInput(event)
    this._familyCreatorService.openFamilyCreatorDialog(objects);
  }
}
