'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { resetPassword } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForgotPasswordFormProps {
  locale: string;
}

export function ForgotPasswordForm({ locale }: ForgotPasswordFormProps) {
  const t = useTranslations('auth');

  const resetWithLocale = resetPassword.bind(null, locale);
  const [state, action, pending] = useActionState(resetWithLocale, null);

  if (state?.success) {
    return (
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">{t('checkEmail')}</h2>
        <p className="text-sm text-muted-foreground">{t('checkEmailDesc')}</p>
        <Link href={`/${locale}/auth/login`} className="block pt-2 text-sm text-primary hover:underline">
          {t('signIn')}
        </Link>
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
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t('sendingReset') : t('sendResetLink')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
          {t('signIn')}
        </Link>
      </p>
    </form>
  );
}
