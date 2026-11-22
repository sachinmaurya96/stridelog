import { describe, expect, it } from 'vitest';
import { formatDistance, formatDuration, formatDurationShort, formatPace, formatSpeed } from '@/lib/format';

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(3932)).toBe('1:05:32');
    expect(formatDuration(332)).toBe('5:32');
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDurationShort(3932)).toBe('1h 05m');
  });

  it('formats pace', () => {
    expect(formatPace(342)).toBe(`5'42"/km`);
    expect(formatPace(0)).toBe(`--'--"/km`);
    expect(formatPace(300, 'mi')).toBe(`8'03"/mi`);
  });

  it('formats distance and speed in km or miles', () => {
    expect(formatDistance(5230)).toBe('5.23 km');
    expect(formatDistance(5230, 'mi')).toBe('3.25 mi');
    expect(formatSpeed(2.5)).toBe('9.0 km/h');
    expect(formatSpeed(2.5, 'mi')).toBe('5.6 mph');
  });
});
