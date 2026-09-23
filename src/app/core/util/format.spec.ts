import { formatClock, formatTime } from './format';

describe('format', () => {
  it('formatClock shows minutes, seconds and tenths', () => {
    expect(formatClock(0)).toBe('0:00.0');
    expect(formatClock(4_260)).toBe('0:04.2');
    expect(formatClock(67_990)).toBe('1:07.9');
  });

  it('formatTime keeps centiseconds for the results screen', () => {
    expect(formatTime(67_420)).toBe('1:07.42');
  });
});
