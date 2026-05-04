import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(req: NextRequest) {
  // Bypass everything for the Viva webhook
  if (req.nextUrl.pathname.startsWith('/api/viva-webhook')) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
