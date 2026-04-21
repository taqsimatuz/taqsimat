'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { signIn } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations('auth');

  const signInWithLocale = signIn.bind(null, locale);
  const [state, action, pending] = useActionState(signInWithLocale, null);

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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t('password')}</Label>
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('forgotPassword')}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder={t('passwordPlaceholder')}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t('signingIn') : t('signIn')}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/auth/signup`} className="text-primary hover:underline">
          {t('signUp')}
        </Link>
      </p>
    </form>
  );
}
