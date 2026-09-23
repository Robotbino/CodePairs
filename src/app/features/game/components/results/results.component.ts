import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  animate,
  animateChild,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { GameSummary } from '../../../../core/models/game.models';
import { formatPercent, formatTime } from '../../../../core/util/format';
import { prefersReducedMotion } from '../../../../core/util/motion';
import { ConfettiCanvasComponent } from '../confetti-canvas/confetti-canvas.component';

/** Win/lose overlay with an animated score tally and rank grade reveal. */
@Component({
  selector: 'cp-results',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ConfettiCanvasComponent],
  templateUrl: './results.component.html',
  styleUrl: './results.component.scss',
  animations: [
    // The overlay drives the panel explicitly: a parent :enter otherwise
    // swallows the child's, and the panel would never animate in.
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        group([
          animate('220ms ease-out', style({ opacity: 1 })),
          query('@panel', animateChild()),
        ]),
      ]),
    ]),
    trigger('panel', [
      transition(':enter', [
        style({
          transform: 'translateY(24px) rotate(-1deg) scale(0.96)',
          opacity: 0,
        }),
        animate(
          '360ms cubic-bezier(0.16, 1, 0.3, 1)',
          style({ transform: 'none', opacity: 1 }),
        ),
      ]),
    ]),
  ],
})
export class ResultsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly title =
    viewChild.required<ElementRef<HTMLElement>>('title');
  protected readonly reduceMotion = prefersReducedMotion();

  readonly summary = input.required<GameSummary>();
  readonly playAgain = output<void>();
  readonly changeDifficulty = output<void>();

  // Animated tally values that count up from zero.
  private readonly animScore = signal(0);
  private readonly animTimeMs = signal(0);
  private readonly animMoves = signal(0);
  private readonly animAccuracy = signal(0);
  private readonly rankRevealed = signal(false);
  /** Actions accept pointer input only once the panel has landed. */
  protected readonly armed = signal(false);

  readonly displayScore = computed(() => Math.round(this.animScore()));
  readonly displayTime = computed(() => formatTime(this.animTimeMs()));
  readonly displayMoves = computed(() => Math.round(this.animMoves()));
  readonly displayAccuracy = computed(() => formatPercent(this.animAccuracy()));
  readonly showRank = this.rankRevealed.asReadonly();

  readonly won = computed(() => this.summary().won);
  /** Final stats as one sentence, read when focus enters the dialog. */
  readonly srSummary = computed(() => {
    const s = this.summary();
    const parts = [
      `Score ${s.score}`,
      `time ${formatTime(s.timeMs)}`,
      `${s.moves} moves`,
      `accuracy ${formatPercent(s.accuracy)}`,
    ];
    if (s.won) parts.push(`rank ${s.rank}`);
    if (s.won && s.isNewBest) parts.push('new best score');
    return `${parts.join(', ')}.`;
  });
  readonly bestTime = computed(() => {
    const best = this.summary().previousBest;
    return best ? formatTime(best.timeMs) : null;
  });

  private frames: number[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    const s = this.summary();
    this.destroyRef.onDestroy(() => this.cleanup());

    if (!s.won || this.reduceMotion) {
      // Losing screens are terse, and reduced motion skips the count-up:
      // snap the stats, no drawn-out celebration.
      this.animScore.set(s.score);
      this.animTimeMs.set(s.timeMs);
      this.animMoves.set(s.moves);
      this.animAccuracy.set(s.accuracy);
      this.rankRevealed.set(true);
      return;
    }

    this.countUp(this.animScore, s.score, 900);
    this.countUp(this.animTimeMs, s.timeMs, 700);
    this.countUp(this.animMoves, s.moves, 700);
    this.countUp(this.animAccuracy, s.accuracy, 900);
    this.timers.push(setTimeout(() => this.rankRevealed.set(true), 1000));
  }

  /**
   * Called when the panel's entrance finishes: enable the actions and move
   * focus into the dialog. Focus goes to the title (top of the panel) rather
   * than a button, so on short screens nothing scrolls out of view; Tab
   * reaches Play again next.
   */
  protected arm(): void {
    if (this.armed()) return;
    this.armed.set(true);
    this.title().nativeElement.focus({ preventScroll: true });
  }

  /**
   * Ease a signal from 0 to `target` over `duration` ms via rAF, with a
   * timeout safety net so the final value always lands even when rAF is
   * throttled (e.g. the winning tab is in the background).
   */
  private countUp(
    target: ReturnType<typeof signal<number>>,
    to: number,
    duration: number,
  ): void {
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      target.set(to * eased);
      if (t < 1) {
        this.frames.push(requestAnimationFrame(step));
      } else {
        target.set(to);
      }
    };
    this.frames.push(requestAnimationFrame(step));
    this.timers.push(setTimeout(() => target.set(to), duration + 100));
  }

  private cleanup(): void {
    this.frames.forEach((f) => cancelAnimationFrame(f));
    this.timers.forEach((t) => clearTimeout(t));
  }
}
