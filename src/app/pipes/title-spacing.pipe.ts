import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'titleSpacing',
  standalone: true
})
export class TitleSpacingPipe implements PipeTransform {

  transform(value: string): string {
    return value.replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
