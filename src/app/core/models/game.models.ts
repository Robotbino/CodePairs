import { SafeHtml } from '@angular/platform-browser';

/** Lifecycle of a single card on the board. */
export type CardStatus = 'hidden' | 'flipped' | 'matched';

/** Overall phase of a game session. */
export type GamePhase = 'idle' | 'playing' | 'won' | 'lost';

/** Supported difficulty levels. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Final performance grade shown on the results screen. */
export type RankGrade = 'S' | 'A' | 'B' | 'C';

/** A card as rendered on the board. `svg` is sanitized for `[innerHTML]`. */
export interface Card {
  readonly id: number;
  readonly pairKey: string;
  readonly label: string;
  readonly svg: SafeHtml;
  readonly status: CardStatus;
}

/** Per-difficulty layout + rules. */
export interface DifficultyConfig {
  readonly label: string;
  readonly pairs: number;
  readonly cols: number;
  readonly attempts: number;
  /** Seconds under which a game earns the full time bonus. */
  readonly parSeconds: number;
}

/** A persisted best result for one difficulty. */
export interface BestScore {
  readonly score: number;
  readonly timeMs: number;
  readonly accuracy: number;
  readonly rank: RankGrade;
}

/** Immutable snapshot of a finished game, handed to the results screen. */
export interface GameSummary {
  readonly difficulty: Difficulty;
  readonly won: boolean;
  readonly score: number;
  readonly timeMs: number;
  readonly moves: number;
  readonly matches: number;
  readonly pairs: number;
  readonly accuracy: number;
  readonly bestCombo: number;
  readonly rank: RankGrade;
  readonly isNewBest: boolean;
  readonly previousBest: BestScore | null;
}

export const DIFFICULTY_CONFIG: Readonly<Record<Difficulty, DifficultyConfig>> = {
  easy: { label: 'Easy', pairs: 2, cols: 2, attempts: 5, parSeconds: 12 },
  medium: { label: 'Medium', pairs: 4, cols: 4, attempts: 6, parSeconds: 35 },
  hard: { label: 'Hard', pairs: 6, cols: 4, attempts: 8, parSeconds: 70 },
};

export const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard'];

/** Base points awarded per match, before the combo multiplier. */
export const BASE_MATCH_POINTS = 100;

/**
 * Maps the current consecutive-match streak (1-based) to a score multiplier.
 * The first match of a streak is 1×; each further unbroken match ramps up.
 */
export function comboMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  if (streak === 2) return 1.5;
  if (streak === 3) return 2;
  if (streak === 4) return 2.5;
  return 3;
}

/** Compute the final letter grade from end-of-game metrics. */
export function gradeRank(params: {
  won: boolean;
  accuracy: number;
  timeMs: number;
  parSeconds: number;
}): RankGrade {
  const { won, accuracy, timeMs, parSeconds } = params;
  if (!won) return 'C';
  const seconds = timeMs / 1000;
  if (accuracy >= 1 && seconds <= parSeconds) return 'S';
  if (accuracy >= 0.8 && seconds <= parSeconds * 1.5) return 'A';
  if (accuracy >= 0.6) return 'B';
  return 'C';
}
