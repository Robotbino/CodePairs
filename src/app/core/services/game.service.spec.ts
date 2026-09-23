import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GameService } from './game.service';
import { ScoreboardService } from './scoreboard.service';
import { Card, DIFFICULTY_CONFIG } from '../models/game.models';
import { MISMATCH_HIDE_MS } from '../models/timing';

describe('GameService', () => {
  let game: GameService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [GameService, ScoreboardService],
    });
    game = TestBed.inject(GameService);
  });

  /** Return two hidden cards that form a matching pair. */
  function firstPair(): [Card, Card] {
    const cards = game.cards().filter((c) => c.status === 'hidden');
    const a = cards[0];
    const b = cards.find((c) => c.id !== a.id && c.pairKey === a.pairKey)!;
    return [a, b];
  }

  /** Return two hidden cards that do NOT match. */
  function firstMismatch(): [Card, Card] {
    const cards = game.cards().filter((c) => c.status === 'hidden');
    const a = cards[0];
    const b = cards.find((c) => c.pairKey !== a.pairKey)!;
    return [a, b];
  }

  it('generates the right number of cards per difficulty', () => {
    game.newGame('easy');
    expect(game.cards().length).toBe(DIFFICULTY_CONFIG.easy.pairs * 2);

    game.newGame('hard');
    expect(game.cards().length).toBe(DIFFICULTY_CONFIG.hard.pairs * 2);
  });

  it('builds exactly two cards for every pairKey', () => {
    game.newGame('medium');
    const counts = new Map<string, number>();
    for (const c of game.cards()) {
      counts.set(c.pairKey, (counts.get(c.pairKey) ?? 0) + 1);
    }
    expect([...counts.values()].every((n) => n === 2)).toBeTrue();
    expect(counts.size).toBe(DIFFICULTY_CONFIG.medium.pairs);
  });

  it('starts in the playing phase after newGame', () => {
    game.newGame('easy');
    expect(game.phase()).toBe('playing');
    expect(game.lives()).toBe(DIFFICULTY_CONFIG.easy.attempts);
  });

  it('scores a match and increments the combo', () => {
    game.newGame('medium');
    const [a, b] = firstPair();
    game.flip(a);
    game.flip(b);

    expect(game.matches()).toBe(1);
    expect(game.combo()).toBe(1);
    expect(game.score()).toBe(100); // first match = 1x
    expect(game.isBoardLocked()).toBeFalse();
  });

  it('applies the combo multiplier on consecutive matches', () => {
    game.newGame('hard');
    const cards = game.cards();
    const keys = [...new Set(cards.map((c) => c.pairKey))];

    // Match the first two distinct pairs in a row.
    for (const key of keys.slice(0, 2)) {
      const [a, b] = cards.filter((c) => c.pairKey === key);
      game.flip(a);
      game.flip(b);
    }
    // 100 (1x) + 150 (2nd match = 1.5x) = 250
    expect(game.combo()).toBe(2);
    expect(game.score()).toBe(250);
  });

  it('resets the combo and costs a life on a mismatch', fakeAsync(() => {
    game.newGame('hard');
    // First, land a match so the combo is non-zero.
    const [pa, pb] = firstPair();
    game.flip(pa);
    game.flip(pb);
    expect(game.combo()).toBe(1);

    const [a, b] = firstMismatch();
    game.flip(a);
    game.flip(b);
    expect(game.isBoardLocked()).toBeTrue(); // locked during comparison
    expect(game.combo()).toBe(0);

    tick(MISMATCH_HIDE_MS);
    expect(game.lives()).toBe(DIFFICULTY_CONFIG.hard.attempts - 1);
    expect(game.isBoardLocked()).toBeFalse();
    expect(game.cards().filter((c) => c.status === 'flipped').length).toBe(0);
  }));

  it('ignores a third click while the board is locked (no race)', fakeAsync(() => {
    game.newGame('hard');
    const [a, b] = firstMismatch();
    game.flip(a);
    game.flip(b); // locks the board

    const third = game.cards().find(
      (c) => c.status === 'hidden' && c.id !== a.id && c.id !== b.id,
    )!;
    game.flip(third);
    expect(third.status).not.toBe('flipped');
    expect(game.cards().find((c) => c.id === third.id)!.status).toBe('hidden');

    tick(MISMATCH_HIDE_MS);
  }));

  it('transitions to won when the last pair is matched', () => {
    game.newGame('easy');
    const cards = game.cards();
    for (const key of new Set(cards.map((c) => c.pairKey))) {
      const [a, b] = cards.filter((c) => c.pairKey === key);
      game.flip(a);
      game.flip(b);
    }
    expect(game.phase()).toBe('won');
    expect(game.summary()?.won).toBeTrue();
  });

  it('transitions to lost when lives run out', fakeAsync(() => {
    game.newGame('easy'); // 5 attempts
    for (let i = 0; i < DIFFICULTY_CONFIG.easy.attempts; i++) {
      const [a, b] = firstMismatch();
      game.flip(a);
      game.flip(b);
      tick(MISMATCH_HIDE_MS);
    }
    expect(game.phase()).toBe('lost');
    expect(game.summary()?.won).toBeFalse();
  }));

  it('ignores a stale repeat event for the same card (no self-match)', () => {
    game.newGame('hard');
    const card = game.cards()[0];
    game.flip(card);
    game.flip(card); // same stale snapshot, status still 'hidden' in it

    expect(game.moves()).toBe(0);
    expect(game.matches()).toBe(0);
    expect(game.cards().filter((c) => c.status === 'flipped').length).toBe(1);
  });

  it('gives every deal fresh card ids', () => {
    game.newGame('hard');
    const first = new Set(game.cards().map((c) => c.id));
    game.restart();
    const second = game.cards().map((c) => c.id);

    expect(second.some((id) => first.has(id))).toBeFalse();
  });

  it('abandon() stops the clock and returns to idle', fakeAsync(() => {
    game.newGame('hard');
    const [a, b] = firstMismatch();
    game.flip(a); // starts the timer
    game.flip(b); // schedules the hide

    game.abandon();
    const frozen = game.elapsedMs();
    tick(MISMATCH_HIDE_MS + 500);

    expect(game.phase()).toBe('idle');
    expect(game.elapsedMs()).toBe(frozen);
    expect(game.lives()).toBe(DIFFICULTY_CONFIG.hard.attempts); // hide never ran
  }));

  it('abandon() leaves a finished game untouched', () => {
    game.newGame('easy');
    const cards = game.cards();
    for (const key of new Set(cards.map((c) => c.pairKey))) {
      const [a, b] = cards.filter((c) => c.pairKey === key);
      game.flip(a);
      game.flip(b);
    }
    game.abandon();
    expect(game.phase()).toBe('won');
  });

  it('announces the first card of a pair, then the outcome', () => {
    game.newGame('hard');
    const [a, b] = firstPair();
    game.flip(a);
    expect(game.announcement()).toBe(`${a.label}.`);

    game.flip(b);
    expect(game.announcement()).toContain(`Match: ${a.label}.`);
  });

  it('announces a mismatch with the lives that will remain', fakeAsync(() => {
    game.newGame('hard');
    const [a, b] = firstMismatch();
    game.flip(a);
    game.flip(b);

    const left = DIFFICULTY_CONFIG.hard.attempts - 1;
    expect(game.announcement()).toContain(`${left} lives left`);
    tick(MISMATCH_HIDE_MS);
    expect(game.lives()).toBe(left);
  }));

  it('computes accuracy from matches over moves', () => {
    game.newGame('hard');
    const [a, b] = firstPair();
    game.flip(a);
    game.flip(b);
    expect(game.accuracy()).toBe(1);
  });
});
