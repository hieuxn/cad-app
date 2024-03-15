import { Component, Injector } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Group, Object3D, Vector3 } from 'three';
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
export class FamilyCreatorPaneComponent {
  private _familyCreatorService: FamilyCreatorService;
  private _layerService: LayerService;
  private _command!: ReactiveMousePlacementCommand;
  private _subscription!: Subscription;
  private _currentGroup!: Group;

  groups: Group[];

  constructor(private _injector: Injector) {
    this._familyCreatorService = _injector.get(FamilyCreatorService)
    this._layerService = _injector.get(LayerService);
    this.groups = this._familyCreatorService.groups;
    this._command = new ReactiveMousePlacementCommand('Place family', true, this._injector);
  }

  execute(group: Group) {
    this._currentGroup = group;
    if (this._subscription) this._subscription.unsubscribe();
    this._subscription = this._command.source$.subscribe(this._place.bind(this));
    this._command.execute();
  }

  private _place(tupe: [BehaviorSubject<Object3D[]>, Vector3[]]) {
    const [destSubject, positions] = tupe;
    if (positions.length === 0) return;

    const group = this._currentGroup.clone();
    group.userData = { ... this._currentGroup.userData };
    group.position.copy(positions.at(-1)!);

    destSubject.next([group]);
  }
}
