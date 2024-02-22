import { Component } from '@angular/core';
import { LayerManagementComponent } from './components/layer-management/layer-management.component';
import { ViewerComponent } from './components/viewer/viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ViewerComponent, LayerManagementComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'cad-app';
}
