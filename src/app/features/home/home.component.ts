import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScoreboardService } from '../../core/services/scoreboard.service';
import { DIFFICULTIES, DIFFICULTY_CONFIG } from '../../core/models/game.models';
import { formatTime } from '../../core/util/format';

/** Landing screen: brand, tagline, best scores and the entry CTA. */
@Component({
  selector: 'cp-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly scoreboard = inject(ScoreboardService);

  protected readonly bestRows = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    label: DIFFICULTY_CONFIG[difficulty].label,
  }));

  protected best(difficulty: (typeof DIFFICULTIES)[number]) {
    const best = this.scoreboard.best(difficulty);
    return best
      ? { score: best.score, time: formatTime(best.timeMs), rank: best.rank }
      : null;
  }
}
