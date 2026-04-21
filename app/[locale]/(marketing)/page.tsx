import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, Coins, BookOpen, TrendingUp, MessageSquare } from 'lucide-react';

type Params = { locale: string };

const featureIcons = {
  balanceSheet: LayoutDashboard,
  zakat: Coins,
  meras: BookOpen,
  investments: TrendingUp,
  advisor: MessageSquare,
} as const;

const featureHrefs = {
  balanceSheet: '/balance-sheet',
  zakat: '/zakat',
  meras: '/meras',
  investments: '/investments',
  advisor: '/advisor',
} as const;

export default async function LandingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'marketing' });
  const tCommon = await getTranslations({ locale, namespace: 'auth' });

  const features = Object.keys(featureIcons) as Array<keyof typeof featureIcons>;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="container max-w-screen-xl px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link href={`/${locale}/auth/signup`}>{t('hero.cta')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/${locale}/balance-sheet`}>{t('hero.ctaGuest')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container max-w-screen-xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((key) => {
            const Icon = featureIcons[key];
            return (
              <Link key={key} href={`/${locale}${featureHrefs[key]}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{t(`features.${key}.title`)}</CardTitle>
                    <CardDescription>{t(`features.${key}.description`)}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
