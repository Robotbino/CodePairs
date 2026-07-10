import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CODE_TOKENS, CodeToken } from '../data/card-deck';
import {
  BASE_MATCH_POINTS,
  Card,
  comboMultiplier,
  Difficulty,
  DIFFICULTY_CONFIG,
  GamePhase,
  GameSummary,
  gradeRank,
} from '../models/game.models';
import { ScoreboardService } from './scoreboard.service';

const MISMATCH_HIDE_MS = 900;
const TIMER_TICK_MS = 100;

/**
 * The single source of truth for a Code Pairs session. All state lives in
 * signals and every transition is an immutable update, so there is no in-place
 * card mutation and no way for a rapid third click to corrupt a comparison.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly scoreboard = inject(ScoreboardService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Writable state ──────────────────────────────────────────────────────
  private readonly _cards = signal<Card[]>([]);
  private readonly _phase = signal<GamePhase>('idle');
  private readonly _flippedIds = signal<number[]>([]);
  private readonly _lockBoard = signal(false);
  private readonly _score = signal(0);
  private readonly _moves = signal(0);
  private readonly _matches = signal(0);
  private readonly _combo = signal(0);
  private readonly _bestCombo = signal(0);
  private readonly _attemptsLeft = signal(0);
  private readonly _difficulty = signal<Difficulty>('easy');
  private readonly _elapsedMs = signal(0);
  private readonly _wrongIds = signal<readonly number[]>([]);
  private readonly _summary = signal<GameSummary | null>(null);

  // ── Public projections ──────────────────────────────────────────────────
  readonly cards = this._cards.asReadonly();
  readonly phase = this._phase.asReadonly();
  readonly score = this._score.asReadonly();
  readonly moves = this._moves.asReadonly();
  readonly matches = this._matches.asReadonly();
  readonly combo = this._combo.asReadonly();
  readonly bestCombo = this._bestCombo.asReadonly();
  readonly lives = this._attemptsLeft.asReadonly();
  readonly difficulty = this._difficulty.asReadonly();
  readonly elapsedMs = this._elapsedMs.asReadonly();
  readonly wrongIds = this._wrongIds.asReadonly();
  readonly isBoardLocked = this._lockBoard.asReadonly();
  readonly summary = this._summary.asReadonly();

  readonly config = computed(() => DIFFICULTY_CONFIG[this._difficulty()]);
  readonly pairsTotal = computed(() => this.config().pairs);
  readonly cols = computed(() => this.config().cols);
  readonly maxLives = computed(() => this.config().attempts);
  readonly multiplier = computed(() => comboMultiplier(this._combo()));
  readonly accuracy = computed(() => {
    const moves = this._moves();
    return moves === 0 ? 1 : this._matches() / moves;
  });
  readonly rank = computed(() =>
    gradeRank({
      won: this._phase() === 'won',
      accuracy: this.accuracy(),
      timeMs: this._elapsedMs(),
      parSeconds: this.config().parSeconds,
    }),
  );

  private timerId: ReturnType<typeof setInterval> | null = null;
  private startedAt = 0;
  private pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    this.destroyRef.onDestroy(() => this.teardown());
  }

  /** Choose a difficulty ahead of starting (used by the selector screen). */
  setDifficulty(difficulty: Difficulty): void {
    this._difficulty.set(difficulty);
  }

  /** Build and start a fresh game. */
  newGame(difficulty: Difficulty = this._difficulty()): void {
    this.teardown();
    this._difficulty.set(difficulty);

    const { pairs, attempts } = DIFFICULTY_CONFIG[difficulty];
    this._cards.set(this.buildDeck(pairs));
    this._flippedIds.set([]);
    this._lockBoard.set(false);
    this._score.set(0);
    this._moves.set(0);
    this._matches.set(0);
    this._combo.set(0);
    this._bestCombo.set(0);
    this._attemptsLeft.set(attempts);
    this._elapsedMs.set(0);
    this._wrongIds.set([]);
    this._summary.set(null);
    this._phase.set('playing');
  }

  /** Replay the current difficulty. */
  restart(): void {
    this.newGame(this._difficulty());
  }

  /**
   * Attempt to flip a card. Guards make illegal clicks (locked board, already
   * revealed card, finished game) inert, so no comparison can be corrupted.
   */
  flip(card: Card): void {
    if (this._phase() !== 'playing') return;
    if (this._lockBoard()) return;
    if (card.status !== 'hidden') return;

    if (this._flippedIds().length === 0 && this.timerId === null) {
      this.startTimer();
    }

    this.setStatus(card.id, 'flipped');
    const flipped = [...this._flippedIds(), card.id];
    this._flippedIds.set(flipped);

    if (flipped.length === 2) {
      this._lockBoard.set(true);
      this._moves.update((m) => m + 1);
      this.resolvePair(flipped[0], flipped[1]);
    }
  }

  private resolvePair(firstId: number, secondId: number): void {
    const cards = this._cards();
    const first = cards.find((c) => c.id === firstId);
    const second = cards.find((c) => c.id === secondId);
    if (!first || !second) {
      this._lockBoard.set(false);
      this._flippedIds.set([]);
      return;
    }

    if (first.pairKey === second.pairKey) {
      this.onMatch(firstId, secondId);
    } else {
      this.onMismatch(firstId, secondId);
    }
  }

  private onMatch(firstId: number, secondId: number): void {
    const streak = this._combo() + 1;
    this._combo.set(streak);
    this._bestCombo.update((b) => Math.max(b, streak));
    this._score.update(
      (s) => s + Math.round(BASE_MATCH_POINTS * comboMultiplier(streak)),
    );
    this._matches.update((m) => m + 1);
    this.setStatus(firstId, 'matched');
    this.setStatus(secondId, 'matched');
    this._flippedIds.set([]);
    this._lockBoard.set(false);

    if (this._matches() === this.pairsTotal()) {
      this.finish(true);
    }
  }

  private onMismatch(firstId: number, secondId: number): void {
    this._combo.set(0);
    this._wrongIds.set([firstId, secondId]);
    this.schedule(() => {
      this._wrongIds.set([]);
      this.setStatus(firstId, 'hidden');
      this.setStatus(secondId, 'hidden');
      this._attemptsLeft.update((a) => a - 1);
      this._flippedIds.set([]);
      this._lockBoard.set(false);
      if (this._attemptsLeft() <= 0) {
        this.finish(false);
      }
    }, MISMATCH_HIDE_MS);
  }

  private finish(won: boolean): void {
    this.stopTimer();
    this._lockBoard.set(true);

    if (won) {
      // Reward speed and surviving lives.
      const { parSeconds } = this.config();
      const seconds = this._elapsedMs() / 1000;
      const timeBonus = Math.max(0, Math.round((parSeconds - seconds) * 5));
      const lifeBonus = this._attemptsLeft() * 50;
      this._score.update((s) => s + timeBonus + lifeBonus);
    }

    this._phase.set(won ? 'won' : 'lost');
    this._summary.set(this.buildSummary(won));
  }

  private buildSummary(won: boolean): GameSummary {
    const difficulty = this._difficulty();
    const rank = gradeRank({
      won,
      accuracy: this.accuracy(),
      timeMs: this._elapsedMs(),
      parSeconds: this.config().parSeconds,
    });
    const previousBest = this.scoreboard.best(difficulty);

    let isNewBest = false;
    if (won) {
      isNewBest = this.scoreboard.record(difficulty, {
        score: this._score(),
        timeMs: this._elapsedMs(),
        accuracy: this.accuracy(),
        rank,
      });
    }

    return {
      difficulty,
      won,
      score: this._score(),
      timeMs: this._elapsedMs(),
      moves: this._moves(),
      matches: this._matches(),
      pairs: this.pairsTotal(),
      accuracy: this.accuracy(),
      bestCombo: this._bestCombo(),
      rank,
      isNewBest,
      previousBest,
    };
  }

  // ── Deck ─────────────────────────────────────────────────────────────────
  private buildDeck(pairCount: number): Card[] {
    const chosen = this.pickTokens(pairCount);
    const cards: Card[] = [];
    chosen.forEach((token, index) => {
      const svg = this.sanitizer.bypassSecurityTrustHtml(token.svg);
      for (let copy = 0; copy < 2; copy++) {
        cards.push({
          id: index * 2 + copy,
          pairKey: token.pairKey,
          label: token.label,
          svg,
          status: 'hidden',
        });
      }
    });
    return this.shuffle(cards);
  }

  /** Randomly draw `count` distinct tokens from the pool. */
  private pickTokens(count: number): CodeToken[] {
    return this.shuffle([...CODE_TOKENS]).slice(0, count);
  }

  /** Fisher–Yates on a fresh copy. */
  private shuffle<T>(items: T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  private setStatus(id: number, status: Card['status']): void {
    this._cards.update((cards) =>
      cards.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  private startTimer(): void {
    this.startedAt = Date.now();
    this.timerId = setInterval(() => {
      this._elapsedMs.set(Date.now() - this.startedAt);
    }, TIMER_TICK_MS);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
      this._elapsedMs.set(Date.now() - this.startedAt);
    }
  }

  private schedule(fn: () => void, delay: number): void {
    const id = setTimeout(() => {
      this.pendingTimeouts.delete(id);
      fn();
    }, delay);
    this.pendingTimeouts.add(id);
  }

  private teardown(): void {
    this.stopTimer();
    for (const id of this.pendingTimeouts) clearTimeout(id);
    this.pendingTimeouts.clear();
  }
}
