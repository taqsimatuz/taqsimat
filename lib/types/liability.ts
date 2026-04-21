import { z } from 'zod';
import { CurrencySchema } from './money';

// Liability categories from architecture §3.2.
// - personal_debt: money the user owes another person (qard, loan to friend)
// - religious_debt: unpaid zakat from prior years, kaffarat
// - loan: conventional or installment loan owed to an institution
export const LIABILITY_CATEGORIES = [
  'personal_debt',
  'religious_debt',
  'loan',
] as const;

export const LiabilityCategorySchema = z.enum(LIABILITY_CATEGORIES);
export type LiabilityCategory = z.infer<typeof LiabilityCategorySchema>;

export const LiabilityMetadataSchema = z
  .object({
    // Short-term debts are deductible from the zakatable pool per §4.2.
    // Long-term debts default to non-deductible pending scholar ruling.
    is_short_term: z.boolean().optional(),
    due_date: z.string().date().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export type LiabilityMetadata = z.infer<typeof LiabilityMetadataSchema>;

const LiabilityInputFields = {
  category: LiabilityCategorySchema,
  label: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema.default('UZS'),
  counterparty: z.string().nullable().optional(),
  metadata: LiabilityMetadataSchema.default({}),
};

export const LiabilityInputSchema = z.object(LiabilityInputFields);
export type LiabilityInput = z.infer<typeof LiabilityInputSchema>;

export const LiabilitySchema = z.object({
  ...LiabilityInputFields,
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Liability = z.infer<typeof LiabilitySchema>;

export function isShortTerm(liability: Liability): boolean {
  // Personal and religious debts are treated as short-term by default — they
  // represent near-term settlements. Conventional loans default to long-term
  // unless explicitly flagged.
  if (liability.metadata.is_short_term !== undefined) {
    return liability.metadata.is_short_term === true;
  }
  return liability.category !== 'loan';
}
