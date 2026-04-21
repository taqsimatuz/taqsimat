import { describe, it, expect } from 'vitest';
import type { Asset, Liability, FxRates } from '@/lib/types';
import {
  computeCompositionBreakdown,
  computeHalalHaramSplit,
  computeLiquidAssetsTotal,
  computeNetWorth,
  computeZakatEligibility,
  zakatableShare,
  type DiagnosticContext,
} from './diagnostics';

const rates: FxRates = { UZS: 1, USD: 12500, EUR: 13600 };
const uzs: DiagnosticContext = { displayCurrency: 'UZS', fxRates: rates };
const usd: DiagnosticContext = { displayCurrency: 'USD', fxRates: rates };

// Test-data helpers. We keep them terse so test cases read as tables.
function asset(
  overrides: Partial<Asset> & Pick<Asset, 'category' | 'amount'>,
): Asset {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    label: null,
    currency: 'UZS',
    metadata: {},
    acquired_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function liability(
  overrides: Partial<Liability> & Pick<Liability, 'category' | 'amount'>,
): Liability {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    user_id: '00000000-0000-0000-0000-000000000001',
    label: null,
    currency: 'UZS',
    counterparty: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('computeNetWorth', () => {
  it('returns 0 for an empty balance sheet', () => {
    expect(computeNetWorth([], [], uzs)).toBe(0);
  });

  it('sums assets minus liabilities in display currency', () => {
    const result = computeNetWorth(
      [
        asset({ category: 'cash', amount: 10_000_000 }),
        asset({ category: 'bank_deposit', amount: 5_000_000 }),
      ],
      [liability({ category: 'loan', amount: 3_000_000 })],
      uzs,
    );
    expect(result).toBe(12_000_000);
  });

  it('converts foreign currency via fxRates', () => {
    const result = computeNetWorth(
      [
        asset({ category: 'cash', amount: 100, currency: 'USD' }),
        asset({ category: 'cash', amount: 1_000_000, currency: 'UZS' }),
      ],
      [],
      uzs,
    );
    // 100 USD * 12500 + 1M UZS = 2,250,000 UZS
    expect(result).toBe(2_250_000);
  });

  it('respects displayCurrency when converting', () => {
    const result = computeNetWorth(
      [asset({ category: 'cash', amount: 12_500_000, currency: 'UZS' })],
      [],
      usd,
    );
    expect(result).toBe(1000);
  });

  it('can yield a negative net worth when debts exceed assets', () => {
    const result = computeNetWorth(
      [asset({ category: 'cash', amount: 1_000 })],
      [liability({ category: 'loan', amount: 5_000 })],
      uzs,
    );
    expect(result).toBe(-4_000);
  });
});

describe('computeLiquidAssetsTotal', () => {
  it('counts cash and bank deposits only', () => {
    const total = computeLiquidAssetsTotal(
      [
        asset({ category: 'cash', amount: 1_000 }),
        asset({ category: 'bank_deposit', amount: 2_000 }),
        asset({ category: 'gold', amount: 5_000 }),
        asset({ category: 'real_property', amount: 100_000 }),
        asset({ category: 'stock', amount: 10_000 }),
      ],
      uzs,
    );
    expect(total).toBe(3_000);
  });
});

describe('computeCompositionBreakdown', () => {
  it('returns every category as a key with zeros for absent categories', () => {
    const breakdown = computeCompositionBreakdown([], uzs);
    expect(breakdown.cash).toBe(0);
    expect(breakdown.gold).toBe(0);
    expect(breakdown.stock).toBe(0);
  });

  it('aggregates by category across currencies', () => {
    const breakdown = computeCompositionBreakdown(
      [
        asset({ category: 'cash', amount: 1_000_000, currency: 'UZS' }),
        asset({ category: 'cash', amount: 100, currency: 'USD' }),
        asset({ category: 'gold', amount: 500_000 }),
      ],
      uzs,
    );
    expect(breakdown.cash).toBe(2_250_000);
    expect(breakdown.gold).toBe(500_000);
    expect(breakdown.stock).toBe(0);
  });
});

describe('zakatableShare', () => {
  it('treats cash, gold, silver, sukuk, stocks, crypto as fully zakatable', () => {
    expect(zakatableShare(asset({ category: 'cash', amount: 1 }))).toBe(1);
    expect(zakatableShare(asset({ category: 'gold', amount: 1 }))).toBe(1);
    expect(zakatableShare(asset({ category: 'silver', amount: 1 }))).toBe(1);
    expect(zakatableShare(asset({ category: 'sukuk', amount: 1 }))).toBe(1);
    expect(zakatableShare(asset({ category: 'stock', amount: 1 }))).toBe(1);
    expect(zakatableShare(asset({ category: 'crypto', amount: 1 }))).toBe(1);
  });

  it('excludes residences, livestock, business equity, and "other" in v1', () => {
    expect(
      zakatableShare(
        asset({
          category: 'real_property',
          amount: 1,
          metadata: { property_type: 'residence' },
        }),
      ),
    ).toBe(0);
    expect(
      zakatableShare(asset({ category: 'real_property', amount: 1 })),
    ).toBe(0);
    expect(zakatableShare(asset({ category: 'livestock', amount: 1 }))).toBe(0);
    expect(
      zakatableShare(asset({ category: 'business_equity', amount: 1 })),
    ).toBe(0);
    expect(zakatableShare(asset({ category: 'other', amount: 1 }))).toBe(0);
  });

  it('treats receivables as zakatable only when collectible', () => {
    expect(
      zakatableShare(
        asset({
          category: 'receivable',
          amount: 1,
          metadata: { is_collectible: true },
        }),
      ),
    ).toBe(1);
    expect(
      zakatableShare(
        asset({
          category: 'receivable',
          amount: 1,
          metadata: { is_collectible: false },
        }),
      ),
    ).toBe(0);
    // default: assume collectible
    expect(zakatableShare(asset({ category: 'receivable', amount: 1 }))).toBe(
      1,
    );
  });
});

describe('computeZakatEligibility', () => {
  const nisab = 5_000_000;

  it('returns not eligible below nisab', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 1_000_000 })],
      [],
      nisab,
      uzs,
    );
    expect(result).toEqual({ eligible: false, zakatableTotal: 1_000_000 });
  });

  it('returns eligible at or above nisab', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 5_000_000 })],
      [],
      nisab,
      uzs,
    );
    expect(result).toEqual({ eligible: true, zakatableTotal: 5_000_000 });
  });

  it('deducts short-term liabilities from the zakatable pool', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 10_000_000 })],
      [liability({ category: 'personal_debt', amount: 6_000_000 })],
      nisab,
      uzs,
    );
    expect(result).toEqual({ eligible: false, zakatableTotal: 4_000_000 });
  });

  it('ignores long-term loans unless explicitly marked short-term', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 10_000_000 })],
      [liability({ category: 'loan', amount: 7_000_000 })],
      nisab,
      uzs,
    );
    expect(result).toEqual({ eligible: true, zakatableTotal: 10_000_000 });
  });

  it('treats a long-term loan as deductible when flagged short_term', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 10_000_000 })],
      [
        liability({
          category: 'loan',
          amount: 7_000_000,
          metadata: { is_short_term: true },
        }),
      ],
      nisab,
      uzs,
    );
    expect(result.zakatableTotal).toBe(3_000_000);
  });

  it('clamps negative zakatable totals at zero', () => {
    const result = computeZakatEligibility(
      [asset({ category: 'cash', amount: 1_000_000 })],
      [liability({ category: 'personal_debt', amount: 5_000_000 })],
      nisab,
      uzs,
    );
    expect(result.zakatableTotal).toBe(0);
    expect(result.eligible).toBe(false);
  });

  it('excludes the residence even when balances are large', () => {
    const result = computeZakatEligibility(
      [
        asset({
          category: 'real_property',
          amount: 500_000_000,
          metadata: { property_type: 'residence' },
        }),
      ],
      [],
      nisab,
      uzs,
    );
    expect(result).toEqual({ eligible: false, zakatableTotal: 0 });
  });
});

describe('computeHalalHaramSplit', () => {
  it('defaults non-screened categories to halal', () => {
    const split = computeHalalHaramSplit(
      [
        asset({ category: 'cash', amount: 1_000 }),
        asset({ category: 'gold', amount: 2_000 }),
        asset({ category: 'real_property', amount: 100_000 }),
      ],
      uzs,
    );
    expect(split).toEqual({ halal: 103_000, haram: 0, unscreened: 0 });
  });

  it('classifies stocks and crypto by screening_status', () => {
    const split = computeHalalHaramSplit(
      [
        asset({
          category: 'stock',
          amount: 100,
          metadata: { screening_status: 'halal' },
        }),
        asset({
          category: 'stock',
          amount: 50,
          metadata: { screening_status: 'haram' },
        }),
        asset({ category: 'crypto', amount: 75 }),
      ],
      uzs,
    );
    expect(split).toEqual({ halal: 100, haram: 50, unscreened: 75 });
  });
});
