import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Re-export locale config from routing.ts so all existing imports still work.
// routing.ts is the Edge-safe file; this file (i18n.ts) must NOT be imported
// by middleware because it contains server-only modules.
export { locales, defaultLocale, type Locale } from './routing';
import { locales, type Locale } from './routing';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();
  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
