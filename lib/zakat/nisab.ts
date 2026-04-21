import type { MoneyAmount } from '@/lib/types';
import { roundMoney } from '@/lib/types';

// Canonical nisab thresholds in grams of pure metal. These values come from
// the Sunnah (20 dinars = 87.48g gold; 200 dirhams = 612.36g silver) and are
// fixed — we do not parameterise them to avoid drift across calls.
export const NISAB_GOLD_GRAMS = 87.48;
export const NISAB_SILVER_GRAMS = 612.36;

export interface NisabResult {
  value: MoneyAmount;
  source: 'gold' | 'silver';
  goldNisab: MoneyAmount;
  silverNisab: MoneyAmount;
}

// Per architecture §4.2: compute both thresholds in the same currency as the
// metal prices and take the lower one. Most Hanafi scholars prefer the lower
// nisab because it maximises the number of obligated payers (more zakat
// reaches the poor). Both values are returned so the UI can show the working.
export function computeNisab(
  goldPricePerGram: MoneyAmount,
  silverPricePerGram: MoneyAmount,
): NisabResult {
  if (goldPricePerGram <= 0 || silverPricePerGram <= 0) {
    throw new Error('Metal prices must be positive to compute nisab');
  }
  const goldNisab = roundMoney(goldPricePerGram * NISAB_GOLD_GRAMS);
  const silverNisab = roundMoney(silverPricePerGram * NISAB_SILVER_GRAMS);
  return goldNisab <= silverNisab
    ? { value: goldNisab, source: 'gold', goldNisab, silverNisab }
    : { value: silverNisab, source: 'silver', goldNisab, silverNisab };
}
