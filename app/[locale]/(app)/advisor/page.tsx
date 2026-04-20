import { setRequestLocale, getTranslations } from 'next-intl/server';

type Params = { locale: string };

export default async function AdvisorPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations('nav');
  const tCommon = await getTranslations('common');

  return (
    <main className="container py-16">
      <h1 className="text-2xl font-semibold">{tNav('advisor')}</h1>
      <p className="text-muted-foreground">{tCommon('comingSoon')}</p>
    </main>
  );
}
