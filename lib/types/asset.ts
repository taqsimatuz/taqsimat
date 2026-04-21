import { z } from 'zod';
import { CurrencySchema } from './money';

// Asset categories live in TypeScript, not as a DB enum, so we can extend
// without migrations (per architecture §3.2).
export const ASSET_CATEGORIES = [
  'cash',
  'bank_deposit',
  'gold',
  'silver',
  'real_property',
  'livestock',
  'stock',
  'sukuk',
  'crypto',
  'receivable',
  'business_equity',
  'other',
] as const;

export const AssetCategorySchema = z.enum(ASSET_CATEGORIES);
export type AssetCategory = z.infer<typeof AssetCategorySchema>;

// Screening status applies to assets where the halal/haram judgement depends
// on per-instrument review (stocks, crypto). Other categories are treated as
// intrinsically halal by default and can be overridden via metadata.
export const ScreeningStatusSchema = z.enum(['halal', 'haram', 'unscreened']);
export type ScreeningStatus = z.infer<typeof ScreeningStatusSchema>;

// Per-category metadata schemas. Kept loose (passthrough) so older rows with
// extra keys still validate, but the known shape is type-checked.
export const GoldMetadataSchema = z
  .object({
    weight_grams: z.number().positive().optional(),
    purity: z.enum(['24k', '22k', '18k', 'other']).optional(),
  })
  .passthrough();

export const SilverMetadataSchema = GoldMetadataSchema;

export const RealPropertyMetadataSchema = z
  .object({
    property_type: z.enum(['residence', 'investment', 'land']).optional(),
    location: z.string().optional(),
  })
  .passthrough();

export const StockMetadataSchema = z
  .object({
    ticker: z.string().optional(),
    shares: z.number().positive().optional(),
    exchange: z.string().optional(),
    screening_status: ScreeningStatusSchema.optional(),
  })
  .passthrough();

export const CryptoMetadataSchema = z
  .object({
    symbol: z.string().optional(),
    amount: z.number().positive().optional(),
    screening_status: ScreeningStatusSchema.optional(),
  })
  .passthrough();

export const ReceivableMetadataSchema = z
  .object({
    debtor: z.string().optional(),
    due_date: z.string().date().optional(),
    is_collectible: z.boolean().optional(),
  })
  .passthrough();

export const BusinessEquityMetadataSchema = z
  .object({
    business_name: z.string().optional(),
    ownership_pct: z.number().min(0).max(100).optional(),
  })
  .passthrough();

// Personal-use flag on real property (residence) or other items is stored in
// metadata to mark them as exempt from zakat.
export const GenericMetadataSchema = z
  .object({
    personal_use: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .passthrough();

export const AssetMetadataSchema = z
  .record(z.string(), z.unknown())
  .default({});
export type AssetMetadata = z.infer<typeof AssetMetadataSchema>;

// Fields a user can actually set on the form / API input.
const AssetInputFields = {
  category: AssetCategorySchema,
  label: z.string().nullable().optional(),
  amount: z.number().nonnegative(),
  currency: CurrencySchema.default('UZS'),
  metadata: AssetMetadataSchema,
  acquired_at: z.string().date().nullable().optional(),
};

export const AssetInputSchema = z.object(AssetInputFields);
export type AssetInput = z.infer<typeof AssetInputSchema>;

// Full DB row shape — superset of input with server-managed fields.
export const AssetSchema = z.object({
  ...AssetInputFields,
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Asset = z.infer<typeof AssetSchema>;

// Narrowed accessors — validate metadata against the category-specific schema
// and return null on mismatch so callers don't have to guess shapes.
export function asGoldMetadata(
  asset: Asset,
): z.infer<typeof GoldMetadataSchema> | null {
  if (asset.category !== 'gold' && asset.category !== 'silver') return null;
  const parsed = GoldMetadataSchema.safeParse(asset.metadata);
  return parsed.success ? parsed.data : null;
}

export function asRealPropertyMetadata(
  asset: Asset,
): z.infer<typeof RealPropertyMetadataSchema> | null {
  if (asset.category !== 'real_property') return null;
  const parsed = RealPropertyMetadataSchema.safeParse(asset.metadata);
  return parsed.success ? parsed.data : null;
}

export function asStockMetadata(
  asset: Asset,
): z.infer<typeof StockMetadataSchema> | null {
  if (asset.category !== 'stock') return null;
  const parsed = StockMetadataSchema.safeParse(asset.metadata);
  return parsed.success ? parsed.data : null;
}

export function asCryptoMetadata(
  asset: Asset,
): z.infer<typeof CryptoMetadataSchema> | null {
  if (asset.category !== 'crypto') return null;
  const parsed = CryptoMetadataSchema.safeParse(asset.metadata);
  return parsed.success ? parsed.data : null;
}

export function asReceivableMetadata(
  asset: Asset,
): z.infer<typeof ReceivableMetadataSchema> | null {
  if (asset.category !== 'receivable') return null;
  const parsed = ReceivableMetadataSchema.safeParse(asset.metadata);
  return parsed.success ? parsed.data : null;
}

export function getScreeningStatus(asset: Asset): ScreeningStatus {
  const stock = asStockMetadata(asset);
  if (stock?.screening_status) return stock.screening_status;
  const crypto = asCryptoMetadata(asset);
  if (crypto?.screening_status) return crypto.screening_status;
  // Categories with intrinsic halal standing default to 'halal'. Stocks and
  // crypto without explicit status are 'unscreened'.
  if (asset.category === 'stock' || asset.category === 'crypto') {
    return 'unscreened';
  }
  return 'halal';
}

export function isPersonalUseResidence(asset: Asset): boolean {
  if (asset.category !== 'real_property') return false;
  const meta = asRealPropertyMetadata(asset);
  return meta?.property_type === 'residence';
}

export function isCollectibleReceivable(asset: Asset): boolean {
  if (asset.category !== 'receivable') return false;
  const meta = asReceivableMetadata(asset);
  // Default to collectible unless the user explicitly marks otherwise.
  return meta?.is_collectible !== false;
}
