import { KeyValue } from '@angular/common';
import { Component, Injector, OnDestroy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Group, Vector3 } from 'three';
import { ReactiveMousePlacementCommand } from '../../../commands/reactive-mouse-placement.command';
import { FamilyCreatorService } from '../../../services/family-creator/family-creator.service';
import { LayerService } from '../../../services/layer.service';

@Component({
  selector: 'app-family-creator-pane',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './family-creator-pane.component.html',
  styleUrl: './family-creator-pane.component.scss'
})
export class FamilyCreatorPaneComponent implements OnDestroy {
  private _familyCreatorService: FamilyCreatorService;
  private _layerService: LayerService;
  private _command!: ReactiveMousePlacementCommand;
  private _commandSubscription!: Subscription;
  private _subscription: Subscription = new Subscription();;
  private _currentFamilyInfo!: KeyValue<string, Group>;
  private _clone!: Group;
  familyMap: Map<string, Group>;

  constructor(private _injector: Injector) {
    this._familyCreatorService = _injector.get(FamilyCreatorService)
    this.familyMap = this._familyCreatorService.familyMap;

    this._layerService = _injector.get(LayerService);
    const sub = this._familyCreatorService.groups.subscribe(familyTemplate => {
      const family = familyTemplate.children[0] as Group;
      this._familyCreatorService.familyMap.set(familyTemplate.uuid, family);

      familyTemplate.clear();
      this._layerService.activeLayer.addObjects(familyTemplate);
    });
    this._subscription.add(sub);
    this._command = new ReactiveMousePlacementCommand('Place family', true, this._injector);
  }
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
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
}
