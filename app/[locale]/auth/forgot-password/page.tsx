import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/forms/forgot-password-form';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auth' });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">{t('resetPassword')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm locale={locale} />
      </CardContent>
    </Card>
  );
}
