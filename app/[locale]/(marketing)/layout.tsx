import type { ReactNode } from 'react';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { Button } from '@/components/ui/button';

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'app' });
  const tAuth = await getTranslations({ locale, namespace: 'auth' });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-xl items-center px-4 sm:px-6">
          <Link href={`/${locale}`} className="mr-6 font-semibold text-primary">
            {t('name')}
          </Link>
          <div className="flex flex-1 items-center justify-end gap-2">
            <LocaleSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${locale}/auth/login`}>{tAuth('signIn')}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/${locale}/auth/signup`}>{tAuth('signUp')}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container max-w-screen-xl px-4 sm:px-6">
          © {new Date().getFullYear()} Taqsimat. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
