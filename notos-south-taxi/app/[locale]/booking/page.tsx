import {getTranslations, setRequestLocale } from 'next-intl/server';
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
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  // Provide localized destination options to the client form
  const destOptions = [
  // TEMPORARY — remove after payment verification
  { slug: 'airport', label: locale === 'el' ? 'Αεροδρόμιο Αθηνών' : 'Athens Airport' },
  { slug: 'athens-centre', label: locale === 'el' ? 'Κέντρο Αθηνών' : 'Athens City Centre' },
  { slug: 'piraeus-port', label: locale === 'el' ? 'Λιμάνι Πειραιά' : 'Piraeus Port' },
  { slug: 'rafina-port', label: locale === 'el' ? 'Λιμάνι Ραφήνας' : 'Rafina Port' },
  { slug: 'vouliagmeni', label: locale === 'el' ? 'Βουλιαγμένη' : 'Vouliagmeni' },
  { slug: 'glyfada', label: locale === 'el' ? 'Γλυφάδα' : 'Glyfada' },
  { slug: 'alimos', label: locale === 'el' ? 'Άλιμος / Μαρίνα' : 'Alimos / Marina' },
  { slug: 'piraeus', label: locale === 'el' ? 'Πειραιάς' : 'Piraeus' },
  { slug: 'varkiza', label: locale === 'el' ? 'Βάρκιζα' : 'Varkiza' },
  { slug: 'lagonisi', label: locale === 'el' ? 'Λαγονήσι' : 'Lagonisi' },
  { slug: 'anavysso', label: locale === 'el' ? 'Ανάβυσσος' : 'Anavyssos' },
  { slug: 'kifisia', label: locale === 'el' ? 'Κηφισιά' : 'Kifisia' },
  { slug: 'sounio', label: locale === 'el' ? 'Σούνιο' : 'Cape Sounion' },
  { slug: 'korinthos', label: locale === 'el' ? 'Κόρινθος' : 'Corinth' },
  { slug: 'ancient-corinth', label: locale === 'el' ? 'Αρχαία Κόρινθος' : 'Ancient Corinth' },
  { slug: 'nafplio', label: locale === 'el' ? 'Ναύπλιο' : 'Nafplio' },
  { slug: 'mycenae', label: locale === 'el' ? 'Μυκήνες' : 'Mycenae' },
  { slug: 'delphi', label: locale === 'el' ? 'Δελφοί' : 'Delphi' },
  { slug: 'meteora', label: locale === 'el' ? 'Μετέωρα' : 'Meteora' },
  { slug: 'kalamata', label: locale === 'el' ? 'Καλαμάτα' : 'Kalamata' },
  { slug: 'patra', label: locale === 'el' ? 'Πάτρα' : 'Patras' },
  { slug: 'chalkida', label: locale === 'el' ? 'Χαλκίδα' : 'Chalkida' },
  { slug: 'thessaloniki', label: locale === 'el' ? 'Θεσσαλονίκη' : 'Thessaloniki' },
  { slug: 'ioannina', label: locale === 'el' ? 'Ιωάννινα' : 'Ioannina' },
  { slug: 'porto-heli', label: locale === 'el' ? 'Πόρτο Χέλι' : 'Porto Heli' },
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
