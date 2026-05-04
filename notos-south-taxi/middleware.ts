import createMiddleware from 'next-intl/middleware';
// ⚠️  Import from routing.ts — NOT from i18n.ts.
// i18n.ts imports 'next-intl/server' and 'next/navigation' which are
// server-only and will crash the Edge runtime that middleware runs on.
import { locales, defaultLocale } from './routing';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
