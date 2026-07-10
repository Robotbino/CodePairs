import { TestBed } from '@angular/core/testing';
import { ScoreboardService } from './scoreboard.service';
import { BestScore } from '../models/game.models';

const STORAGE_KEY = 'codepairs.best';

const sample: BestScore = { score: 500, timeMs: 8000, accuracy: 1, rank: 'S' };

describe('ScoreboardService', () => {
  let service: ScoreboardService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [ScoreboardService] });
    service = TestBed.inject(ScoreboardService);
  });

  it('records a first result as a new best', () => {
    expect(service.record('easy', sample)).toBeTrue();
    expect(service.best('easy')).toEqual(sample);
  });

  it('only overwrites when the candidate is better', () => {
    service.record('easy', sample);
    const worse: BestScore = { ...sample, score: 100 };
    expect(service.record('easy', worse)).toBeFalse();
    expect(service.best('easy')?.score).toBe(500);

    const better: BestScore = { ...sample, score: 900 };
    expect(service.record('easy', better)).toBeTrue();
    expect(service.best('easy')?.score).toBe(900);
  });

  it('breaks score ties on faster time', () => {
    service.record('medium', sample);
    const faster: BestScore = { ...sample, timeMs: 4000 };
    expect(service.record('medium', faster)).toBeTrue();
    expect(service.best('medium')?.timeMs).toBe(4000);
  });

  it('persists across service instances', () => {
    service.record('hard', sample);
    const fresh = TestBed.inject(ScoreboardService);
    // A brand new instance re-reads from storage.
    const another = new (ScoreboardService as unknown as {
      new (): ScoreboardService;
    })();
    expect(another.best('hard')).toEqual(sample);
    expect(fresh.best('hard')).toEqual(sample);
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const safe = new (ScoreboardService as unknown as {
      new (): ScoreboardService;
    })();
    expect(safe.best('easy')).toBeNull();
  });
});
