import type { ReactNode } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { AppHeader } from '@/components/app-header';
import { AppNav } from '@/components/app-nav';
import { getCurrentUser } from '@/lib/supabase/session';

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} />
      <div className="border-b bg-background">
        <div className="container max-w-screen-xl px-4 sm:px-6">
          <AppNav />
        </div>
      </div>
      <main className="flex-1 container max-w-screen-xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
