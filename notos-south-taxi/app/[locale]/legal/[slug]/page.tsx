import { notFound } from 'next/navigation';
import {getTranslations, getMessages, unstable_setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n';

const SLUGS = ['terms', 'privacy', 'cookies', 'cancellation'] as const;
type Slug = (typeof SLUGS)[number];

const TITLE_KEY: Record<Slug, string> = {
  terms: 'termsTitle',
  privacy: 'privacyTitle',
  cookies: 'cookiesTitle',
  cancellation: 'cancellationTitle'
};
const BODY_KEY: Record<Slug, string> = {
  terms: 'termsBody',
  privacy: 'privacyBody',
  cookies: 'cookiesBody',
  cancellation: 'cancellationBody'
};

export function generateStaticParams() {
  return SLUGS.flatMap((slug) => [
    { locale: 'en', slug },
    { locale: 'el', slug }
  ]);
}

export default async function LegalPage({
  params: { locale, slug }
}: {
  params: { locale: Locale; slug: string };
}) {
  unstable_setRequestLocale(locale);
  if (!SLUGS.includes(slug as Slug)) notFound();
  const s = slug as Slug;

  const t = await getTranslations({ locale });
  // We pull the raw HTML body straight from messages
  const messages = (await getMessages()) as any;
  const title = t(`legal.${TITLE_KEY[s]}`);
  const html: string = messages?.legal?.[BODY_KEY[s]] || '';

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <div className="text-xs uppercase tracking-[0.18em] text-notos-blue/70">
        {locale === 'el' ? 'Νομικά' : 'Legal'}
      </div>
      <h1 className="mt-2 font-display text-4xl font-black text-notos-blue-deep md:text-5xl">{title}</h1>
      <div
        className="legal-prose mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <style>{`
        .legal-prose h2 {
          font-family: var(--font-display);
          font-size: 1.35rem;
          font-weight: 700;
          color: #06245A;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose p {
          color: rgba(14,14,16,0.82);
          line-height: 1.7;
          margin-bottom: 1rem;
        }
        .legal-prose a {
          color: #0B3D91;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
      `}</style>
    </article>
  );
}
