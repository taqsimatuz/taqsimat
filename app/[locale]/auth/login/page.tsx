import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';

export default async function LoginPage({
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
        <CardTitle className="text-center">{t('signIn')}</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm locale={locale} />
      </CardContent>
    </Card>
  );
}
