import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {
  constructor() {
    // iOS Safari only applies :active while a touch listener exists; without
    // it buttons show no pressed state. Registered outside the zone so taps
    // don't trigger change detection.
    const doc = inject(DOCUMENT);
    inject(NgZone).runOutsideAngular(() =>
      doc.addEventListener('touchstart', () => {}, { passive: true }),
    );
  }
}
