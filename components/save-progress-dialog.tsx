'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ConvertAccountForm } from '@/components/forms/convert-account-form';

interface SaveProgressDialogProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveProgressDialog({
  locale,
  open,
  onOpenChange,
}: SaveProgressDialogProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [converted, setConverted] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {converted ? t('verifyEmailTitle') : t('signUp')}
          </DialogTitle>
          {!converted && (
            <DialogDescription>
              Create an account to save your data permanently.
            </DialogDescription>
          )}
        </DialogHeader>
        {!converted && (
          <ConvertAccountForm
            locale={locale}
            onSuccess={() => setConverted(true)}
          />
        )}
        {converted && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t('verifyEmailDesc', { email: '' })}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              {tCommon('close')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
