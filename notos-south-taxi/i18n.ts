import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export { locales, defaultLocale, type Locale } from './routing';
import { locales, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
