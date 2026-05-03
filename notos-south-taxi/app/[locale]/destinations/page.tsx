import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { DESTINATIONS } from '@/lib/site-config';
import { FIXED_ROUTES } from '@/lib/pricing';
import RotatingPhotos from '@/components/RotatingPhotos';
import type { Locale } from '@/i18n';

export default async function DestinationsIndex({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale });

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-black text-notos-blue-deep md:text-5xl">{t('destinations.title')}</h1>
        <p className="mt-3 text-notos-blue-deep/70">{t('destinations.subtitle')}</p>
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINATIONS.map((d, idx) => {
          const price = FIXED_ROUTES[`airport:${d.slug}`];
          return (
            <Link key={d.slug} href={`/${locale}/destinations/${d.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative h-44 overflow-hidden">
                <div className="absolute inset-0 transition group-hover:scale-105">
                  <RotatingPhotos images={d.images} alt={d.name[locale]} interval={4500} startDelay={idx * 350} />
                </div>
                {price && (
                  <div className="absolute inset-x-3 top-3 inline-flex w-fit rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-notos-blue-deep">
                    {locale === 'el' ? 'από' : 'from'} €{price}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="font-display text-lg font-bold text-notos-blue-deep">{d.name[locale]}</div>
                <p className="mt-1 text-sm text-notos-blue-deep/65">{d.blurb[locale]}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
