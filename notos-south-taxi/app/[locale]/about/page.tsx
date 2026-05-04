import {getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n';

export default async function AboutPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-4xl font-black text-notos-blue-deep md:text-5xl">{t('about.title')}</h1>
      <p className="mt-6 text-lg text-notos-blue-deep/80">{t('about.body')}</p>
    </section>
  );
}
