import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { DrawingService } from '../../services/drawing.service';
import { ThreeDService } from '../../services/three-d.service';

@Component({
  selector: 'app-viewer',
  standalone: true,
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.scss'
})
export class ViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container!: ElementRef;

  public constructor(private threeDService: ThreeDService, private drawingService: DrawingService) {
  }
  public ngAfterViewInit(): void {
    this.threeDService.init(this.container);
  }

  public ngOnInit(): void {
  }

  @HostListener('window:click', ['$event'])
  public onWindowClick(event: MouseEvent): void {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left; // x position within the element.
    const y = event.clientY - rect.top;  // y position within the element.
    this.drawingService.addPoint(x, y);
  }

  public startDrawing(): void {
    this.drawingService.startDrawing();
  }
}
