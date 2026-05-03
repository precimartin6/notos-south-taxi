import {getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import BookingForm from '@/components/BookingForm';
import { DESTINATIONS } from '@/lib/site-config';
import type { Locale } from '@/i18n';

export default async function BookingPage({
  params: { locale },
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { from?: string; to?: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale });
  // Provide localized destination options to the client form
  const destOptions = [
    { slug: 'airport', label: locale === 'el' ? 'Αεροδρόμιο Αθηνών' : 'Athens International Airport' },
    ...DESTINATIONS.map((d) => ({ slug: d.slug, label: d.name[locale] }))
  ];

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
      <h1 className="font-display text-3xl font-black text-notos-blue-deep md:text-4xl">{t('form.title')}</h1>
      <p className="mt-2 text-notos-blue-deep/70">{t('form.subtitle')}</p>
      <div className="mt-8">
        <BookingForm
          locale={locale}
          destinations={destOptions}
          defaultFrom={searchParams.from || 'airport'}
          defaultTo={searchParams.to || ''}
        />
      </div>
    </section>
  );
}
