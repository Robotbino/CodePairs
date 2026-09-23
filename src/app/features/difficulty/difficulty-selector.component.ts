import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import {
  Difficulty,
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
} from '../../core/models/game.models';
import { TAP_GUARD_MS } from '../../core/models/timing';

/** Difficulty picker; starting a level seeds the game and routes to the board. */
@Component({
  selector: 'cp-difficulty-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './difficulty-selector.component.html',
  styleUrl: './difficulty-selector.component.scss',
})
export class DifficultySelectorComponent {
  private readonly game = inject(GameService);
  private readonly router = inject(Router);
  private readonly shownAt = performance.now();

  /** The level being started, while navigation to the board is in flight. */
  protected readonly pending = signal<Difficulty | null>(null);

  protected readonly levels = DIFFICULTIES.map((difficulty) => {
    const cfg = DIFFICULTY_CONFIG[difficulty];
    return {
      difficulty,
      label: cfg.label,
      grid: `${cfg.cols}×${Math.ceil((cfg.pairs * 2) / cfg.cols)}`,
      pairs: cfg.pairs,
      attempts: cfg.attempts,
    };
  });

  protected start(difficulty: Difficulty): void {
    // A double-tap on Play can land its second tap here.
    if (performance.now() - this.shownAt < TAP_GUARD_MS) return;
    if (this.pending()) return;

    this.pending.set(difficulty);
    this.game.newGame(difficulty);
    void this.router
      .navigate(['/play'])
      .finally(() => this.pending.set(null));
  }
}
