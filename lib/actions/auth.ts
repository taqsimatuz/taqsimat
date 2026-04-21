'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
});

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function signIn(
  locale: string,
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = SignInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect(`/${locale}/balance-sheet`);
}

export async function signUp(
  locale: string,
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signOut(locale: string): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect(`/${locale}`);
}

export async function resetPassword(
  locale: string,
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = ResetPasswordSchema.safeParse({
    email: formData.get('email'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid email' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signInAnonymously(locale: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    return;
  }

  // Upsert a guest profile row — the DB trigger handles created_at/updated_at
  await supabase.from('profiles').upsert({
    id: data.user.id,
    is_guest: true,
    madhhab: 'hanafi',
    preferred_language: locale,
  });

  revalidatePath('/', 'layout');
}

export async function convertGuestAccount(
  locale: string,
  _prevState: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await supabase.from('profiles').update({ is_guest: false }).eq(
    'id',
    (await supabase.auth.getUser()).data.user?.id ?? '',
  );

  revalidatePath('/', 'layout');
  return { success: true };
}
