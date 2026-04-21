import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { UserMenu } from '@/components/user-menu';

interface AppHeaderProps {
  user?: { email?: string | null } | null;
}

export function AppHeader({ user }: AppHeaderProps) {
  const t = useTranslations('app');
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center px-4 sm:px-6">
        <Link
          href={`/${locale}`}
          className="mr-6 flex items-center gap-2 font-semibold"
        >
          <span className="text-primary">{t('name')}</span>
        </Link>
        <div className="flex flex-1 items-center justify-end gap-2">
          <LocaleSwitcher />
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
