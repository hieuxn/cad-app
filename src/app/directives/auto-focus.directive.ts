import { AfterViewInit, Directive, ElementRef, Input, booleanAttribute } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterViewInit {
  @Input({ transform: booleanAttribute }) appAutofocus: boolean = true;

  constructor(private el: ElementRef) { }

  ngAfterViewInit() {
    if (this.appAutofocus) {
      setTimeout(() => {
        this.el.nativeElement.focus();
      }, 0);
    }
  }
}
