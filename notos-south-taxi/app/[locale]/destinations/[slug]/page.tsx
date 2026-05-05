import { notFound } from 'next/navigation';
import Link from 'next/link';
import {getTranslations, setRequestLocale } from 'next-intl/server';
import { DESTINATIONS, getDestination } from '@/lib/site-config';
import { FIXED_ROUTES, extractDayPrice } from '@/lib/pricing';
import type { Locale } from '@/i18n';

export function generateStaticParams() {
  return DESTINATIONS.flatMap((d) => [
    { locale: 'en', slug: d.slug },
    { locale: 'el', slug: d.slug }
  ]);
}

export default async function DestinationPage({
  params: { locale, slug }
}: {
  params: { locale: Locale; slug: string };
}) {
  setRequestLocale(locale);
  const d = getDestination(slug);
  if (!d) notFound();
  const t = await getTranslations({ locale });
  const price = extractDayPrice(FIXED_ROUTES[`airport:${d.slug}`]);

  return (
    <article>
      <div className="relative h-[44vh] min-h-[320px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${d.images[0]})` }} />
        <div className="absolute inset-0 bg-gradient-to-t from-notos-blue-deep/85 via-notos-blue-deep/40 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-5 pb-10 sm:px-8">
          <div className="text-xs uppercase tracking-[0.18em] text-notos-yellow">
            {locale === 'el' ? 'Προορισμός' : 'Destination'}
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-black text-white md:text-6xl">{d.name[locale]}</h1>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-12 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div className="md:col-span-2 prose prose-lg prose-headings:font-display prose-headings:text-notos-blue-deep">
          <p className="lead text-xl text-notos-blue-deep/80">{d.blurb[locale]}</p>
          <p>{d.body[locale]}</p>
        </div>
        <aside className="md:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-notos-blue/10 bg-white p-6 shadow-card">
            {price && (
              <>
                <div className="text-xs uppercase tracking-wider text-notos-blue-deep/60">
                  {locale === 'el' ? 'Από αεροδρόμιο' : 'From Athens Airport'}
                </div>
                <div className="mt-1 font-display text-4xl font-black text-notos-blue-deep">€{price}</div>
                <div className="mt-1 text-xs text-notos-blue-deep/60">
                  {locale === 'el' ? 'σταθερή τιμή · ταξί' : 'fixed price · taxi'}
                </div>
                <hr className="my-4 border-notos-blue/10" />
              </>
            )}
            <Link
              href={`/${locale}/booking?to=${d.slug}`}
              className="btn-primary w-full"
            >
              {t('popular.bookRoute')}
            </Link>
            <p className="mt-3 text-xs text-notos-blue-deep/60">
              {locale === 'el'
                ? 'Κρατάμε τη θέση σας με μια μικρή προκαταβολή. Τα υπόλοιπα στον οδηγό.'
                : 'We hold your seat with a small deposit. The rest with the driver.'}
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}
