import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

type Params = { locale: string };

export default async function LandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('app');

  return (
    <main className="container flex min-h-screen flex-col items-center justify-center gap-4 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{t('name')}</h1>
      <p className="text-muted-foreground">{t('tagline')}</p>
    </main>
  );
}
