import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatTime } from '../../../../core/util/format';

/** Top-of-board status bar: score, timer, lives pips and a combo meter. */
@Component({
  selector: 'cp-hud',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hud.component.html',
  styleUrl: './hud.component.scss',
})
export class HudComponent {
  readonly score = input.required<number>();
  readonly elapsedMs = input.required<number>();
  readonly lives = input.required<number>();
  readonly maxLives = input.required<number>();
  readonly combo = input.required<number>();
  readonly multiplier = input.required<number>();

  readonly time = computed(() => formatTime(this.elapsedMs()));
  readonly livesArray = computed(() =>
    Array.from({ length: this.maxLives() }, (_, i) => i < this.lives()),
  );
  readonly showCombo = computed(() => this.combo() >= 2);
}
