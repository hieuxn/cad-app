import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-object-control-toolbar',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './object-control-toolbar.component.html',
  styleUrl: './object-control-toolbar.component.scss'
})
export class ObjectControlToolbarComponent {
  play() { }
}
