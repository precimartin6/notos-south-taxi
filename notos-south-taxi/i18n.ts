import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Fall back to default locale when next-intl can't determine it
  // (instead of crashing — which is what was breaking the production runtime).
  const resolved = locales.includes(locale as Locale) ? (locale as Locale) : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`./messages/${resolved}.json`)).default
  };
});
