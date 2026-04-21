import { describe, it, expect } from 'vitest';
import {
  computeNisab,
  NISAB_GOLD_GRAMS,
  NISAB_SILVER_GRAMS,
} from './nisab';

describe('computeNisab', () => {
  it('uses the gold threshold when gold is cheaper per nisab', () => {
    // Pick prices where silver nisab > gold nisab.
    const result = computeNisab(1_200_000, 15_000);
    // gold: 87.48 × 1.2M = 104,976,000
    // silver: 612.36 × 15k = 9,185,400
    // silver is lower → source = silver (per spec "use the lower")
    expect(result.source).toBe('silver');
    expect(result.value).toBe(result.silverNisab);
  });

  it('uses the silver threshold when silver nisab is lower (the typical case)', () => {
    // Real-world-ish: gold ~1.2M UZS/g, silver ~15k UZS/g → silver nisab is lower.
    const result = computeNisab(1_200_000, 15_000);
    expect(result.source).toBe('silver');
    expect(result.goldNisab).toBe(87.48 * 1_200_000);
    expect(result.silverNisab).toBe(612.36 * 15_000);
  });

  it('picks gold when silver price is inflated so its nisab exceeds gold', () => {
    // Force gold to be the lower threshold.
    const result = computeNisab(100, 1_000_000);
    // gold: 87.48 × 100 = 8748
    // silver: 612.36 × 1M = 612,360,000
    expect(result.source).toBe('gold');
    expect(result.value).toBe(87.48 * 100);
  });

  it('rejects non-positive metal prices', () => {
    expect(() => computeNisab(0, 10)).toThrow();
    expect(() => computeNisab(10, -1)).toThrow();
  });

  it('exposes the canonical gram thresholds', () => {
    expect(NISAB_GOLD_GRAMS).toBe(87.48);
    expect(NISAB_SILVER_GRAMS).toBe(612.36);
  });
});
