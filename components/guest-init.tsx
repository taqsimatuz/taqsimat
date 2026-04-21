'use client';

import { useEffect, useRef } from 'react';
import { signInAnonymously } from '@/lib/actions/auth';

interface GuestInitProps {
  locale: string;
}

/**
 * Silently creates an anonymous Supabase session for first-time visitors.
 * Renders nothing — side-effect only. Placed in the (app) layout.
 */
export function GuestInit({ locale }: GuestInitProps) {
  const initiated = useRef(false);

  useEffect(() => {
    if (initiated.current) return;
    initiated.current = true;
    signInAnonymously(locale).catch(() => undefined);
  }, [locale]);

  return null;
}
