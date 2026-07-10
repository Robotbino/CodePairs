import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { Card } from '../../core/models/game.models';
import { CardComponent } from './components/card/card.component';
import { HudComponent } from './components/hud/hud.component';
import { ResultsComponent } from './components/results/results.component';

/** The board screen: HUD, card grid and the results overlay. */
@Component({
  selector: 'cp-game',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, HudComponent, ResultsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly game = inject(GameService);

  protected readonly summary = this.game.summary;
  protected readonly isOver = computed(() => this.game.phase() !== 'playing');
  private readonly wrongSet = computed(() => new Set(this.game.wrongIds()));

  ngOnInit(): void {
    // If someone deep-links to /play without picking a level, start a default.
    if (this.game.phase() === 'idle') {
      this.game.newGame();
    }
  }

  protected isWrong(card: Card): boolean {
    return this.wrongSet().has(card.id);
  }

  protected onFlip(card: Card): void {
    this.game.flip(card);
  }

  protected onPlayAgain(): void {
    this.game.restart();
  }

  protected onChangeDifficulty(): void {
    this.router.navigate(['/difficulty']);
  }
}
