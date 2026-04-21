import type {
  Asset,
  Currency,
  FxRates,
  Liability,
  MoneyAmount,
} from '@/lib/types';
import { convertAmount, roundMoney } from '@/lib/types';
import { zakatableShare } from '@/lib/balance-sheet/diagnostics';
import { isShortTerm } from '@/lib/types';

// Canonical rate: 2.5% (one-fortieth) for cash-equivalent assets in the
// Hanafi school. Kept here — not parameterised — to avoid accidental drift.
export const ZAKAT_RATE = 0.025;

export interface ZakatInput {
  assets: Asset[];
  liabilities: Liability[];
  // Nisab expressed in UZS (the currency of the gold/silver prices table).
  // We convert into `displayCurrency` for comparison and reporting.
  nisabUzs: MoneyAmount;
  displayCurrency: Currency;
  fxRates: FxRates;
}

export interface ZakatBreakdownEntry {
  assetId: string;
  category: string;
  zakatable: MoneyAmount;
  rationale: string;
}

export interface ZakatResult {
  totalZakatable: MoneyAmount;
  nisabThreshold: MoneyAmount;
  aboveNisab: boolean;
  zakatOwed: MoneyAmount;
  displayCurrency: Currency;
  breakdown: ZakatBreakdownEntry[];
  deductibleLiabilities: MoneyAmount;
}

function rationaleFor(asset: Asset, share: number): string {
  if (share === 1) {
    switch (asset.category) {
      case 'cash':
      case 'bank_deposit':
        return 'Cash-equivalent: full value zakatable';
      case 'gold':
      case 'silver':
        return 'Precious metal: full value zakatable';
      case 'stock':
        return 'Stock: market value zakatable (v1 simplification)';
      case 'sukuk':
        return 'Sukuk: full value zakatable';
      case 'crypto':
        return 'Crypto: market value zakatable (Screened lens)';
      case 'receivable':
        return 'Collectible receivable: full value zakatable';
      default:
        return 'Full value zakatable';
    }
  }
  switch (asset.category) {
    case 'real_property':
      return 'Real property: not zakatable on value (rental income only — v2)';
    case 'livestock':
      return 'Livestock: out of scope for v1';
    case 'business_equity':
      return 'Business equity: deferred to v2 (business zakat is complex)';
    case 'receivable':
      return 'Receivable marked not collectible: excluded';
    case 'other':
      return '"Other" assets: excluded pending classification';
    default:
      return 'Excluded from zakatable pool';
  }
}

export function calculateZakat(input: ZakatInput): ZakatResult {
  const { assets, liabilities, nisabUzs, displayCurrency, fxRates } = input;

  const breakdown: ZakatBreakdownEntry[] = [];
  let totalZakatable = 0;
  for (const asset of assets) {
    const share = zakatableShare(asset);
    const inDisplay = convertAmount(
      asset.amount,
      asset.currency,
      displayCurrency,
      fxRates,
    );
    const zakatable = roundMoney(inDisplay * share);
    totalZakatable += zakatable;
    breakdown.push({
      assetId: asset.id,
      category: asset.category,
      zakatable,
      rationale: rationaleFor(asset, share),
    });
  }

  const deductibleLiabilities = liabilities
    .filter(isShortTerm)
    .reduce(
      (acc, l) =>
        acc + convertAmount(l.amount, l.currency, displayCurrency, fxRates),
      0,
    );

  const totalAfterDebts = Math.max(0, totalZakatable - deductibleLiabilities);
  const nisabThreshold = convertAmount(
    nisabUzs,
    'UZS',
    displayCurrency,
    fxRates,
  );
  const aboveNisab = totalAfterDebts >= nisabThreshold;
  const zakatOwed = aboveNisab ? totalAfterDebts * ZAKAT_RATE : 0;

  return {
    totalZakatable: roundMoney(totalAfterDebts),
    nisabThreshold: roundMoney(nisabThreshold),
    aboveNisab,
    zakatOwed: roundMoney(zakatOwed),
    displayCurrency,
    breakdown,
    deductibleLiabilities: roundMoney(deductibleLiabilities),
  };
}
