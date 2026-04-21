'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LayoutDashboard, Coins, BookOpen, TrendingUp, MessageSquare, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'balanceSheet', href: '/balance-sheet', icon: LayoutDashboard },
  { key: 'zakat', href: '/zakat', icon: Coins },
  { key: 'meras', href: '/meras', icon: BookOpen },
  { key: 'investments', href: '/investments', icon: TrendingUp },
  { key: 'advisor', href: '/advisor', icon: MessageSquare },
  { key: 'courses', href: '/courses', icon: GraduationCap },
] as const;

export function AppNav() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {navItems.map(({ key, href, icon: Icon }) => {
        const fullHref = `/${locale}${href}`;
        const isActive = pathname.startsWith(fullHref);
        return (
          <Link
            key={key}
            href={fullHref}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
