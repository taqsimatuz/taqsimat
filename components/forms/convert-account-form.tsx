'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { convertGuestAccount } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ConvertAccountFormProps {
  locale: string;
  onSuccess?: () => void;
}

export function ConvertAccountForm({ locale, onSuccess }: ConvertAccountFormProps) {
  const t = useTranslations('auth');

  const convertWithLocale = convertGuestAccount.bind(null, locale);
  const [state, action, pending] = useActionState(convertWithLocale, null);

  if (state?.success) {
    onSuccess?.();
    return (
      <div className="space-y-2 text-center py-4">
        <p className="font-medium">{t('verifyEmailTitle')}</p>
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
        <Label htmlFor="convert-email">{t('email')}</Label>
        <Input
          id="convert-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="convert-password">{t('password')}</Label>
        <Input
          id="convert-password"
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
    </form>
  );
}
