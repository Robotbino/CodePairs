import { Injectable, signal } from '@angular/core';
import { BestScore, Difficulty } from '../models/game.models';

type BestScoreMap = Partial<Record<Difficulty, BestScore>>;

const STORAGE_KEY = 'codepairs.best';

/**
 * Persists the best result per difficulty in localStorage and exposes it as a
 * signal so screens react to new records. All storage access is guarded so the
 * app is safe under SSR / privacy-mode where `localStorage` may throw.
 */
@Injectable({ providedIn: 'root' })
export class ScoreboardService {
  private readonly _bests = signal<BestScoreMap>(this.read());
  readonly bests = this._bests.asReadonly();

  best(difficulty: Difficulty): BestScore | null {
    return this._bests()[difficulty] ?? null;
  }

  /**
   * Records a result if it beats the stored best (higher score wins; ties break
   * on faster time). Returns true when a new record was written.
   */
  record(difficulty: Difficulty, candidate: BestScore): boolean {
    const current = this._bests()[difficulty];
    if (current && !this.isBetter(candidate, current)) {
      return false;
    }
    const next: BestScoreMap = { ...this._bests(), [difficulty]: candidate };
    this._bests.set(next);
    this.write(next);
    return true;
  }

  clear(): void {
    this._bests.set({});
    this.write({});
  }

  private isBetter(a: BestScore, b: BestScore): boolean {
    if (a.score !== b.score) return a.score > b.score;
    return a.timeMs < b.timeMs;
  }

  private read(): BestScoreMap {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      return this.sanitize(parsed);
    } catch {
      return {};
    }
  }

  private write(map: BestScoreMap): void {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Storage unavailable (private mode / SSR): keep in-memory only.
    }
  }

  /** Defensively validate parsed JSON into a well-formed map. */
  private sanitize(input: unknown): BestScoreMap {
    if (!input || typeof input !== 'object') return {};
    const out: BestScoreMap = {};
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    for (const level of difficulties) {
      const entry = (input as Record<string, unknown>)[level];
      if (entry && typeof entry === 'object') {
        const e = entry as Record<string, unknown>;
        if (
          typeof e['score'] === 'number' &&
          typeof e['timeMs'] === 'number' &&
          typeof e['accuracy'] === 'number' &&
          typeof e['rank'] === 'string'
        ) {
          out[level] = {
            score: e['score'],
            timeMs: e['timeMs'],
            accuracy: e['accuracy'],
            rank: e['rank'] as BestScore['rank'],
          };
        }
      }
    }
    return out;
  }
}
