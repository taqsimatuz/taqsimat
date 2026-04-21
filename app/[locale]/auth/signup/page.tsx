import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from '@/components/forms/signup-form';

export default async function SignupPage({
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
        <CardTitle className="text-center">{t('signUp')}</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm locale={locale} />
      </CardContent>
    </Card>
  );
}
