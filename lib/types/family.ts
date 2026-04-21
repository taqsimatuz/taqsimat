import { z } from 'zod';

// Relationship enum from architecture §3.3 — the closed set of heir types the
// Hanafi Meras algorithm reasons about. Adding a new relationship means
// adding rules to the algorithm, so extensions are deliberate.
export const RELATIONSHIPS = [
  'spouse',
  'son',
  'daughter',
  'sons_son',
  'sons_daughter',
  'sons_sons_son',
  'sons_sons_daughter',
  'father',
  'mother',
  'fathers_father',
  'mothers_mother',
  'fathers_mother',
  'fathers_fathers_father',
  'blood_brother',
  'blood_sister',
  'paternal_brother',
  'paternal_sister',
  'maternal_brother',
  'maternal_sister',
  'blood_brothers_son',
  'paternal_brothers_son',
  'blood_uncle',
  'paternal_uncle',
  'blood_uncles_son',
  'paternal_uncles_son',
] as const;

export const RelationshipSchema = z.enum(RELATIONSHIPS);
export type Relationship = z.infer<typeof RelationshipSchema>;

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;

const FamilyMemberInputFields = {
  relationship: RelationshipSchema,
  gender: GenderSchema.nullable().optional(),
  is_alive: z.boolean().default(true),
  count: z.number().int().nonnegative().default(1),
  name: z.string().nullable().optional(),
};

export const FamilyMemberInputSchema = z.object(FamilyMemberInputFields);
export type FamilyMemberInput = z.infer<typeof FamilyMemberInputSchema>;

export const FamilyMemberSchema = z.object({
  ...FamilyMemberInputFields,
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
});
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;
