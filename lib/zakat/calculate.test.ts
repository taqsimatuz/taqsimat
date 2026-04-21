import { describe, it, expect } from 'vitest';
import type { Asset, FxRates, Liability } from '@/lib/types';
import { calculateZakat, ZAKAT_RATE } from './calculate';

const rates: FxRates = { UZS: 1, USD: 12500 };

function asset(
  overrides: Partial<Asset> & Pick<Asset, 'category' | 'amount'>,
): Asset {
  return {
    id: '00000000-0000-0000-0000-0000000000aa',
    user_id: '00000000-0000-0000-0000-0000000000aa',
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
    id: '00000000-0000-0000-0000-0000000000bb',
    user_id: '00000000-0000-0000-0000-0000000000bb',
    label: null,
    currency: 'UZS',
    counterparty: null,
    metadata: {},
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('calculateZakat', () => {
  it('exposes the canonical 2.5% rate', () => {
    expect(ZAKAT_RATE).toBe(0.025);
  });

  it('returns zero owed below nisab', () => {
    const result = calculateZakat({
      assets: [asset({ category: 'cash', amount: 1_000_000 })],
      liabilities: [],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    expect(result.aboveNisab).toBe(false);
    expect(result.zakatOwed).toBe(0);
    expect(result.totalZakatable).toBe(1_000_000);
    expect(result.nisabThreshold).toBe(10_000_000);
  });

  it('charges 2.5% when above nisab', () => {
    const result = calculateZakat({
      assets: [asset({ category: 'cash', amount: 100_000_000 })],
      liabilities: [],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    expect(result.aboveNisab).toBe(true);
    expect(result.zakatOwed).toBe(2_500_000);
  });

  it('sums a mixed balance sheet correctly', () => {
    const result = calculateZakat({
      assets: [
        asset({ category: 'cash', amount: 20_000_000 }),
        asset({ category: 'gold', amount: 30_000_000 }),
        asset({ category: 'sukuk', amount: 10_000_000 }),
        asset({ category: 'stock', amount: 40_000_000 }),
        asset({
          category: 'real_property',
          amount: 2_000_000_000,
          metadata: { property_type: 'residence' },
        }),
      ],
      liabilities: [],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    // 20 + 30 + 10 + 40 = 100M zakatable; residence excluded.
    expect(result.totalZakatable).toBe(100_000_000);
    expect(result.zakatOwed).toBe(2_500_000);
  });

  it('deducts short-term debts before the nisab comparison', () => {
    const result = calculateZakat({
      assets: [asset({ category: 'cash', amount: 12_000_000 })],
      liabilities: [
        liability({ category: 'personal_debt', amount: 8_000_000 }),
      ],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    // 12M - 8M = 4M < nisab
    expect(result.totalZakatable).toBe(4_000_000);
    expect(result.deductibleLiabilities).toBe(8_000_000);
    expect(result.aboveNisab).toBe(false);
  });

  it('ignores long-term loans unless marked short_term', () => {
    const result = calculateZakat({
      assets: [asset({ category: 'cash', amount: 50_000_000 })],
      liabilities: [liability({ category: 'loan', amount: 30_000_000 })],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    expect(result.deductibleLiabilities).toBe(0);
    expect(result.totalZakatable).toBe(50_000_000);
    expect(result.zakatOwed).toBe(1_250_000);
  });

  it('converts nisab and balances into the display currency', () => {
    const result = calculateZakat({
      assets: [asset({ category: 'cash', amount: 10_000, currency: 'USD' })],
      liabilities: [],
      nisabUzs: 12_500_000, // 1000 USD at rates above
      displayCurrency: 'USD',
      fxRates: rates,
    });
    expect(result.nisabThreshold).toBe(1000);
    expect(result.totalZakatable).toBe(10_000);
    expect(result.zakatOwed).toBe(250);
  });

  it('attaches a rationale and zakatable amount to every asset', () => {
    const result = calculateZakat({
      assets: [
        asset({ category: 'cash', amount: 1_000_000 }),
        asset({ category: 'livestock', amount: 5_000_000 }),
        asset({
          category: 'receivable',
          amount: 2_000_000,
          metadata: { is_collectible: false },
        }),
      ],
      liabilities: [],
      nisabUzs: 10_000_000,
      displayCurrency: 'UZS',
      fxRates: rates,
    });
    expect(result.breakdown).toHaveLength(3);
    expect(result.breakdown[0]?.zakatable).toBe(1_000_000);
    expect(result.breakdown[0]?.rationale).toMatch(/Cash/);
    expect(result.breakdown[1]?.zakatable).toBe(0);
    expect(result.breakdown[1]?.rationale).toMatch(/Livestock/);
    expect(result.breakdown[2]?.zakatable).toBe(0);
    expect(result.breakdown[2]?.rationale).toMatch(/not collectible/);
  });
});
