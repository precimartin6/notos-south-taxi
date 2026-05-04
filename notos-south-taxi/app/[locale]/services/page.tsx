import {getTranslations, setRequestLocale } from 'next-intl/server';
import { ShieldCheck, Clock, Map, Sparkles, Users } from 'lucide-react';
import type { Locale } from '@/i18n';

export default async function ServicesPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const items: { key: 'transfer'|'h24'|'tours'|'sightseeing'|'vans'|'corporate'; icon: React.ReactNode }[] = [
    { key: 'transfer', icon: <ShieldCheck className="h-5 w-5" /> },
    { key: 'h24', icon: <Clock className="h-5 w-5" /> },
    { key: 'tours', icon: <Map className="h-5 w-5" /> },
    { key: 'sightseeing', icon: <Sparkles className="h-5 w-5" /> },
    { key: 'vans', icon: <Users className="h-5 w-5" /> },
    { key: 'corporate', icon: <ShieldCheck className="h-5 w-5" /> }
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-black text-notos-blue-deep md:text-5xl">{t('services.title')}</h1>
        <p className="mt-3 text-notos-blue-deep/70">{t('services.subtitle')}</p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.key} className="rounded-2xl border border-notos-blue/10 bg-white p-7">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-notos-blue-deep text-notos-yellow">{it.icon}</div>
            <div className="mt-4 font-display text-xl font-bold text-notos-blue-deep">{t(`services.items.${it.key}.title`)}</div>
            <p className="mt-2 text-notos-blue-deep/70">{t(`services.items.${it.key}.body`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
