import { z } from 'zod';

// Madhhab is locked to 'hanafi' in the UI at launch but architecturally the
// Meras engine is a pure function keyed on this field (CLAUDE.md constraint
// §6). Keeping the enum open lets us add other schools without a migration.
export const MADHHABS = ['hanafi', 'shafii', 'maliki', 'hanbali'] as const;
export const MadhhabSchema = z.enum(MADHHABS);
export type Madhhab = z.infer<typeof MadhhabSchema>;

export const LanguageSchema = z.enum(['en', 'uz']);
export type Language = z.infer<typeof LanguageSchema>;

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  display_name: z.string().nullable(),
  preferred_language: LanguageSchema.default('uz'),
  jurisdiction: z.string().length(2).default('UZ'),
  madhhab: MadhhabSchema.default('hanafi'),
  hawl_anniversary: z.string().date().nullable(),
  is_guest: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;
