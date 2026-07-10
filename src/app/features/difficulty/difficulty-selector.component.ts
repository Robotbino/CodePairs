import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import {
  Difficulty,
  DIFFICULTIES,
  DIFFICULTY_CONFIG,
} from '../../core/models/game.models';

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
    this.game.newGame(difficulty);
    this.router.navigate(['/play']);
  }
}
