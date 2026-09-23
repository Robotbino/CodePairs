import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { formatClock } from '../../../../core/util/format';

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

  readonly time = computed(() => formatClock(this.elapsedMs()));
  readonly livesArray = computed(() =>
    Array.from({ length: this.maxLives() }, (_, i) => i < this.lives()),
  );
  readonly showCombo = computed(() => this.combo() >= 2);
  /** On phones the pips split into two even rows (e.g. 4 + 4 for 8 lives). */
  readonly pipCols = computed(() => Math.ceil(this.maxLives() / 2));
}
