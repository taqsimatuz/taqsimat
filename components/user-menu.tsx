'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { User as UserIcon, LogOut, Settings } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserMenuProps {
  user?: User | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations('auth');
  const locale = useLocale();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <a href={`/${locale}/auth/login`}>{t('signIn')}</a>
        </Button>
        <Button size="sm" asChild>
          <a href={`/${locale}/auth/signup`}>{t('signUp')}</a>
        </Button>
      </div>
    );
  }

  const email = user.email ?? null;
  const initials = email ? email.slice(0, 2).toUpperCase() : 'G';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 rounded-full p-0"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {email && (
          <>
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              {email}
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem asChild>
          <a href={`/${locale}/account`}>
            <UserIcon className="mr-2 h-4 w-4" />
            {t('myAccount')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/${locale}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            {t('settings')}
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={`/${locale}/auth/signout`} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            {t('signOut')}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
