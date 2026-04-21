import type {
  Asset,
  AssetCategory,
  Currency,
  FxRates,
  Liability,
  MoneyAmount,
  ScreeningStatus,
} from '@/lib/types';
import {
  ASSET_CATEGORIES,
  convertAmount,
  getScreeningStatus,
  isCollectibleReceivable,
  isPersonalUseResidence,
  isShortTerm,
  roundMoney,
} from '@/lib/types';

// Pure diagnostic functions over the balance sheet. All outputs are in
// `displayCurrency`; cross-currency amounts are converted via `fxRates` at
// read time so stored values never drift (architecture §4.1).
export interface DiagnosticContext {
  displayCurrency: Currency;
  fxRates: FxRates;
}

function toDisplay(
  amount: MoneyAmount,
  from: Currency,
  ctx: DiagnosticContext,
): MoneyAmount {
  return convertAmount(amount, from, ctx.displayCurrency, ctx.fxRates);
}

function sumAssets(
  assets: Asset[],
  ctx: DiagnosticContext,
  predicate: (a: Asset) => boolean = () => true,
): MoneyAmount {
  return assets
    .filter(predicate)
    .reduce((acc, a) => acc + toDisplay(a.amount, a.currency, ctx), 0);
}

function sumLiabilities(
  liabilities: Liability[],
  ctx: DiagnosticContext,
  predicate: (l: Liability) => boolean = () => true,
): MoneyAmount {
  return liabilities
    .filter(predicate)
    .reduce((acc, l) => acc + toDisplay(l.amount, l.currency, ctx), 0);
}

export function computeNetWorth(
  assets: Asset[],
  liabilities: Liability[],
  ctx: DiagnosticContext,
): MoneyAmount {
  return roundMoney(sumAssets(assets, ctx) - sumLiabilities(liabilities, ctx));
}

// Liquid = cash on hand + bank deposits. Gold, silver, stocks, crypto are
// semi-liquid (saleable but with friction / price risk) and excluded from
// this narrow metric.
const LIQUID_CATEGORIES = new Set<AssetCategory>(['cash', 'bank_deposit']);

export function computeLiquidAssetsTotal(
  assets: Asset[],
  ctx: DiagnosticContext,
): MoneyAmount {
  return roundMoney(
    sumAssets(assets, ctx, (a) => LIQUID_CATEGORIES.has(a.category)),
  );
}

export function computeCompositionBreakdown(
  assets: Asset[],
  ctx: DiagnosticContext,
): Record<AssetCategory, MoneyAmount> {
  const breakdown = Object.fromEntries(
    ASSET_CATEGORIES.map((c) => [c, 0]),
  ) as Record<AssetCategory, MoneyAmount>;

  for (const asset of assets) {
    breakdown[asset.category] += toDisplay(asset.amount, asset.currency, ctx);
  }

  for (const category of ASSET_CATEGORIES) {
    breakdown[category] = roundMoney(breakdown[category]);
  }
  return breakdown;
}

// Zakat eligibility treatment per architecture §4.2. Encoded as a small
// table so other modules can reuse it without re-implementing the rules.
// Returns the portion of the asset's amount (in its native currency) that
// counts toward the zakatable total.
export function zakatableShare(asset: Asset): number {
  switch (asset.category) {
    case 'cash':
    case 'bank_deposit':
    case 'gold':
    case 'silver':
    case 'sukuk':
    case 'stock':
    case 'crypto':
      return 1;
    case 'receivable':
      return isCollectibleReceivable(asset) ? 1 : 0;
    case 'real_property':
      return isPersonalUseResidence(asset) ? 0 : 0; // v1: property value not zakatable
    case 'livestock':
    case 'business_equity':
    case 'other':
      return 0;
  }
}

export function computeZakatEligibility(
  assets: Asset[],
  liabilities: Liability[],
  nisab: MoneyAmount,
  ctx: DiagnosticContext,
): { eligible: boolean; zakatableTotal: MoneyAmount } {
  const zakatableAssets = assets.reduce(
    (acc, a) =>
      acc + toDisplay(a.amount, a.currency, ctx) * zakatableShare(a),
    0,
  );
  const deductibleDebts = sumLiabilities(liabilities, ctx, isShortTerm);
  const zakatableTotal = roundMoney(
    Math.max(0, zakatableAssets - deductibleDebts),
  );
  return { eligible: zakatableTotal >= nisab, zakatableTotal };
}

export function computeHalalHaramSplit(
  assets: Asset[],
  ctx: DiagnosticContext,
): Record<ScreeningStatus, MoneyAmount> {
  const split: Record<ScreeningStatus, MoneyAmount> = {
    halal: 0,
    haram: 0,
    unscreened: 0,
  };
  for (const asset of assets) {
    const status = getScreeningStatus(asset);
    split[status] += toDisplay(asset.amount, asset.currency, ctx);
  }
  split.halal = roundMoney(split.halal);
  split.haram = roundMoney(split.haram);
  split.unscreened = roundMoney(split.unscreened);
  return split;
}
