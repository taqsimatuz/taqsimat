'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signUp } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignupFormProps {
  locale: string;
}

export function SignupForm({ locale }: SignupFormProps) {
  const t = useTranslations('auth');

  const signUpWithLocale = signUp.bind(null, locale);
  const [state, action, pending] = useActionState(signUpWithLocale, null);

  if (state?.success) {
    return (
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">{t('verifyEmailTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('verifyEmailDesc', { email: '' })}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={t('passwordPlaceholder')}
          required
          minLength={8}
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t('signingUp') : t('signUp')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t('hasAccount')}{' '}
        <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </form>
  );
}
