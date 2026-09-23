import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { Card } from '../../core/models/game.models';
import { RESULTS_DELAY_MS, TAP_GUARD_MS } from '../../core/models/timing';
import { prefersReducedMotion } from '../../core/util/motion';
import { CardComponent } from './components/card/card.component';
import { HudComponent } from './components/hud/hud.component';
import { ResultsComponent } from './components/results/results.component';

/** Number of `--cp-tone-N` card colours defined in the design tokens. */
const TONE_COUNT = 6;

/** The board screen: HUD, card grid and the results overlay. */
@Component({
  selector: 'cp-game',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, HudComponent, ResultsComponent],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
  animations: [
    trigger('results', [
      transition(':leave', [
        style({ pointerEvents: 'none' }),
        animate('160ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class GameComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly board = viewChild.required<ElementRef<HTMLElement>>('board');
  protected readonly game = inject(GameService);
  protected readonly reduceMotion = prefersReducedMotion();

  protected readonly summary = this.game.summary;
  protected readonly isOver = computed(() => this.game.phase() !== 'playing');
  /**
   * The results overlay waits a beat after the game ends so the final pair
   * visibly lands before it is covered.
   */
  protected readonly resultsVisible = signal(false);
  /** Row count of the current grid — drives the height-aware card sizing. */
  protected readonly rows = computed(() =>
    Math.ceil(this.game.cards().length / this.game.cols()),
  );
  private readonly wrongSet = computed(() => new Set(this.game.wrongIds()));
  /** Input is ignored until this time, right after a new deal. */
  private tapGuardUntil = 0;
  /**
   * Revealed-face colour per pair. Each pair in the current deal gets its own
   * tone, so two different pairs never share a colour.
   */
  private readonly tones = computed(() => {
    const keys = [...new Set(this.game.cards().map((c) => c.pairKey))].sort();
    return new Map(
      keys.map((key, i): [string, number] => [key, i % TONE_COUNT]),
    );
  });

  constructor() {
    effect((onCleanup) => {
      if (!this.isOver()) {
        this.resultsVisible.set(false);
        return;
      }
      const timer = setTimeout(
        () => this.resultsVisible.set(true),
        RESULTS_DELAY_MS,
      );
      onCleanup(() => clearTimeout(timer));
    });

    // Leaving mid-game (Quit, browser back) must not leave the clock running.
    inject(DestroyRef).onDestroy(() => this.game.abandon());
  }

  ngOnInit(): void {
    // If someone deep-links to /play without picking a level, start a default.
    if (this.game.phase() === 'idle') {
      this.game.newGame();
    }
  }

  protected toneOf(card: Card): number {
    return this.tones().get(card.pairKey) ?? 0;
  }

  protected isWrong(card: Card): boolean {
    return this.wrongSet().has(card.id);
  }

  protected onFlip(card: Card): void {
    if (this.tapGuarded()) return;
    this.game.flip(card);
  }

  protected onPlayAgain(): void {
    if (this.tapGuarded()) return;
    // A double-tap on Restart / Play again must not also hit the new board.
    this.tapGuardUntil = performance.now() + TAP_GUARD_MS;
    this.game.restart();
  }

  /** Play again from the results dialog: also bring focus back to the board. */
  protected onPlayAgainFromResults(): void {
    if (this.tapGuarded()) return;
    this.onPlayAgain();
    // After render, once the board is no longer inert.
    afterNextRender(
      () => this.board().nativeElement.focus({ preventScroll: true }),
      { injector: this.injector },
    );
  }

  protected onChangeDifficulty(): void {
    if (this.tapGuarded()) return;
    this.router.navigate(['/difficulty']);
  }

  private tapGuarded(): boolean {
    return performance.now() < this.tapGuardUntil;
  }
}
