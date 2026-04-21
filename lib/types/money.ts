import { z } from 'zod';

export const CurrencySchema = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO 4217 code');

export type Currency = z.infer<typeof CurrencySchema>;

// FxRates convention: rates[code] = value of 1 unit of `code` expressed in the
// reference currency. We default the reference to UZS because that is the
// nisab currency and the default display currency for launch users.
// Example: { UZS: 1, USD: 12500, EUR: 13600 } means 1 USD = 12500 UZS.
export type FxRates = Record<string, number>;

// Monetary amount. Numbers are safe here because we're well inside JS integer
// precision for any realistic balance sheet (2^53 / 100 ≈ 90 trillion units).
// Results that cross presentation boundaries should go through `roundMoney`.
export type MoneyAmount = number;

export function roundMoney(amount: MoneyAmount): MoneyAmount {
  return Math.round(amount * 100) / 100;
}

export class MissingFxRateError extends Error {
  constructor(public readonly currency: string) {
    super(`No FX rate available for currency "${currency}"`);
    this.name = 'MissingFxRateError';
  }
}

export function convertAmount(
  amount: MoneyAmount,
  from: Currency,
  to: Currency,
  rates: FxRates,
): MoneyAmount {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (fromRate === undefined) throw new MissingFxRateError(from);
  if (toRate === undefined) throw new MissingFxRateError(to);
  return (amount * fromRate) / toRate;
}
