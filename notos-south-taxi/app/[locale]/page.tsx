import {getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Map, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { DESTINATIONS, SITE, type Destination } from '@/lib/site-config';
import { FIXED_ROUTES } from '@/lib/pricing';
import RotatingPhotos from '@/components/RotatingPhotos';
import FleetSection from '@/components/FleetSection';
import ReviewsCarousel from '@/components/ReviewsCarousel';
import type { Locale } from '@/i18n';

export default async function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const featured = DESTINATIONS.filter((d) => d.featured);

  // Structured data for Google. LocalBusiness schema lights up the rich card
  // in search results: hours, phone, address, ratings, the lot.
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notosouthtaxi.gr';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TaxiService',
    name: SITE.name,
    description:
      locale === 'el'
        ? 'Αδειοδοτημένο ταξί Αθηνών με βάση τη Ριβιέρα. Μεταφορές, εκδρομές, ξεναγήσεις — 24/7.'
        : 'Licensed Athens taxi based on the Riviera. Transfers, day tours, sightseeing — 24/7.',
    url: SITE_URL,
    telephone: SITE.phone,
    email: SITE.email,
    image: `${SITE_URL}/photos/fleet/taxi-1.jpg`,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Apollonos 10',
      addressLocality: 'Vouliagmeni',
      postalCode: '166 71',
      addressCountry: 'GR'
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Attica, Greece'
    },
    openingHours: 'Mo-Su 00:00-23:59',
    sameAs: [SITE.social.facebook, SITE.social.instagram],
    vatID: SITE.vatId
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-notos-yellow via-notos-yellow to-amber-200" />
        <div
          className="absolute inset-0 -z-10 opacity-[0.06]"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"60\" height=\"60\" viewBox=\"0 0 60 60\"><path d=\"M0 30h60M30 0v60\" stroke=\"%23000\" stroke-width=\"1\"/></svg>')"
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-notos-blue-deep px-3 py-1 text-xs font-semibold uppercase tracking-wider text-notos-yellow">
              <Sparkles className="h-3.5 w-3.5" /> {t('hero.eyebrow')}
            </div>
            <h1 className="mt-5 font-display text-5xl font-black leading-[1.02] text-notos-blue-deep md:text-7xl">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-notos-blue-deep/80">{t('hero.subtitle')}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${locale}/booking`} className="btn-primary bg-notos-blue-deep text-notos-yellow hover:bg-notos-blue">
                {t('hero.ctaBook')} <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="btn-ghost">
                {t('hero.ctaCall')}
              </a>
            </div>
            <ul className="mt-7 grid max-w-xl grid-cols-1 gap-2 text-sm text-notos-blue-deep/75 sm:grid-cols-3">
              {[t('hero.trust1'), t('hero.trust2'), t('hero.trust3')].map((x) => (
                <li key={x} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-notos-blue" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">
            <ReviewsCarousel locale={locale} />
          </div>
        </div>
        <div className="greek-key-border h-1" />
      </section>

      {/* POPULAR ROUTES */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl font-bold text-notos-blue-deep md:text-4xl">{t('popular.title')}</h2>
            <p className="mt-2 max-w-xl text-notos-blue-deep/70">{t('popular.subtitle')}</p>
          </div>
          <Link href={`/${locale}/destinations`} className="hidden text-sm font-semibold text-notos-blue-deep underline-offset-4 hover:underline md:inline">
            {t('popular.viewAll')} →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d, idx) => {
            const price = FIXED_ROUTES[`airport:${d.slug}`];
            return <RouteCard key={d.slug} d={d} price={price} locale={locale} idx={idx} />;
          })}
        </div>
        <div className="mt-6 md:hidden">
          <Link href={`/${locale}/destinations`} className="text-sm font-semibold text-notos-blue-deep underline">
            {t('popular.viewAll')} →
          </Link>
        </div>
      </section>

      {/* SERVICE AREA — neighbourhoods we pick up from */}
      <section className="bg-notos-paper py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold tracking-tight text-notos-blue-deep md:text-3xl">
              {t('serviceArea.title')}
            </h2>
            <p className="mt-2 text-sm text-notos-blue-deep/70">{t('serviceArea.subtitle')}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {(t.raw('serviceArea.neighbourhoods') as string[]).map((n) => (
              <span
                key={n}
                className="rounded-full border border-notos-blue/15 bg-white px-3.5 py-1.5 text-sm font-medium text-notos-blue-deep"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FLEET */}
      <FleetSection locale={locale} />

      {/* SERVICES */}
      <section className="border-y border-notos-blue/10 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold text-notos-blue-deep md:text-4xl">{t('services.title')}</h2>
            <p className="mt-2 text-notos-blue-deep/70">{t('services.subtitle')}</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(['transfer','h24','tours','sightseeing','vans','corporate'] as const).map((k, i) => (
              <ServiceCard key={k} icon={SERVICE_ICONS[i]} title={t(`services.items.${k}.title`)} body={t(`services.items.${k}.body`)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="overflow-hidden rounded-3xl bg-notos-blue-deep p-10 md:p-14">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-bold text-white md:text-4xl">
                {locale === 'el' ? 'Έτοιμοι για ταξίδι;' : 'Ready to travel?'}
              </h3>
              <p className="mt-3 max-w-md text-white/80">
                {locale === 'el'
                  ? 'Προσφορά σε ένα λεπτό. Κρατάμε τη θέση σας με μια μικρή προκαταβολή — τα υπόλοιπα στον οδηγό.'
                  : 'A quote in a minute. We hold your seat with a small online deposit — the rest with the driver.'}
              </p>
            </div>
            <div className="md:justify-self-end">
              <Link href={`/${locale}/booking`} className="btn-primary text-base">
                {t('hero.ctaBook')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

const SERVICE_ICONS = [
  <ShieldCheck key="i1" className="h-5 w-5" />,
  <Clock key="i2" className="h-5 w-5" />,
  <Map key="i3" className="h-5 w-5" />,
  <Sparkles key="i4" className="h-5 w-5" />,
  <Users key="i5" className="h-5 w-5" />,
  <ShieldCheck key="i6" className="h-5 w-5" />
];

function RouteCard({ d, price, locale, idx = 0 }: { d: Destination; price?: number; locale: Locale; idx?: number }) {
  return (
    <Link href={`/${locale}/destinations/${d.slug}`} className="group overflow-hidden rounded-2xl bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-44 overflow-hidden">
        <div className="absolute inset-0 transition group-hover:scale-105">
          <RotatingPhotos images={d.images} alt={d.name[locale]} interval={4500} startDelay={idx * 600} />
        </div>
        <div className="absolute inset-x-3 top-3 inline-flex w-fit rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-notos-blue-deep">
          {locale === 'el' ? 'από' : 'from'} €{price ?? '—'}
        </div>
      </div>
      <div className="p-5">
        <div className="font-display text-lg font-bold text-notos-blue-deep">{d.name[locale]}</div>
        <p className="mt-1 line-clamp-2 text-sm text-notos-blue-deep/65">{d.blurb[locale]}</p>
      </div>
    </Link>
  );
}

function ServiceCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-notos-blue/10 bg-notos-paper p-6">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-notos-blue-deep text-notos-yellow">{icon}</div>
      <div className="mt-4 font-display text-lg font-bold text-notos-blue-deep">{title}</div>
      <p className="mt-1 text-sm text-notos-blue-deep/70">{body}</p>
    </div>
  );
}

function HeroCard({ locale }: { locale: Locale }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-notos-blue-deep p-1 shadow-card">
      <div className="relative h-[360px] w-full overflow-hidden rounded-[20px]">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1600&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-notos-blue-deep via-notos-blue-deep/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
          <div className="text-xs uppercase tracking-[0.18em] text-notos-yellow">Athens · Sounion · Meteora</div>
          <div className="mt-1 font-display text-2xl font-bold">{locale === 'el' ? 'Είστε στην Ελλάδα. Σας οδηγούμε εμείς.' : "You're in Greece. We'll drive."}</div>
        </div>
      </div>
    </div>
  );
}
