import { setRequestLocale } from 'next-intl/server';

type Params = { locale: string };

export default async function AboutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <main className="container py-16" />;
}
