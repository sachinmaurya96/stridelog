import { describe, expect, it } from 'vitest';
import { caloriesKcal, estimateSteps, metFor, strideM } from '@/lib/fitness';

describe('MET', () => {
  it('uses the defaults when speed is unknown', () => {
    expect(metFor('walk')).toBe(3.5);
    expect(metFor('run', 0)).toBe(9.8);
  });

  it('matches the reference speeds', () => {
    expect(metFor('run', 8)).toBeCloseTo(8.3);
    expect(metFor('run', 10)).toBeCloseTo(9.8);
    expect(metFor('run', 12)).toBeCloseTo(11.8);
    expect(metFor('walk', 3)).toBeCloseTo(3.0);
    expect(metFor('walk', 5)).toBeCloseTo(3.8);
  });

  it('interpolates and clamps', () => {
    expect(metFor('walk', 4)).toBeCloseTo(3.4);
    expect(metFor('run', 9)).toBeCloseTo(9.05);
    expect(metFor('run', 30)).toBeCloseTo(14.5);
    expect(metFor('walk', 1)).toBeCloseTo(2.0);
  });
});

describe('calories (kcal = MET × kg × hours)', () => {
  it('a 70 kg person running 10 km in 1 hour burns ~686 kcal', () => {
    expect(caloriesKcal({ type: 'run', weightKg: 70, durationSec: 3600, distanceM: 10_000 })).toBe(686);
  });

  it('a 60 kg person walking 2 km in 30 min burns ~102 kcal', () => {
    expect(caloriesKcal({ type: 'walk', weightKg: 60, durationSec: 1800, distanceM: 2000 })).toBe(102);
  });

  it('is 0 without time', () => {
    expect(caloriesKcal({ type: 'run', weightKg: 70, durationSec: 0, distanceM: 0 })).toBe(0);
  });
});

describe('steps estimate', () => {
  it('uses a height-based stride', () => {
    expect(strideM('walk', 180)).toBeCloseTo(0.747);
    expect(strideM('run', 180)).toBeCloseTo(1.17);
    expect(estimateSteps('walk', 747, 180)).toBe(1000);
  });
});
