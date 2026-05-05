import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

/**
 * Maintenance mode.
 *
 * To enable: in Vercel → Project → Settings → Environment Variables,
 * add or change `MAINTENANCE_MODE` to `true`. Redeploy (or it picks up
 * automatically on next request, depending on Vercel cache).
 *
 * To bypass while testing: visit any URL with `?maintenance_bypass=<secret>`
 * where the secret matches the `MAINTENANCE_BYPASS_TOKEN` env var.
 * That sets a cookie so subsequent requests skip the maintenance page.
 *
 * Routes always allowed through:
 *   - /maintenance         (the maintenance page itself)
 *   - /api/*               (so Viva webhook etc. still work)
 *   - /robots.txt, /sitemap.xml, /favicon* (so SEO doesn't die)
 *   - any static asset (handled by the matcher already)
 */
function isMaintenance() {
  return process.env.MAINTENANCE_MODE === 'true';
}

const BYPASS_COOKIE = 'notos_maintenance_bypass';

export default function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // API routes always pass through (Viva webhook, status checks, etc.)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Viva payment redirects: these come back WITHOUT a locale prefix.
  // Redirect them to /en/... preserving all query params (orderCode, s, t, etc.).
  if (pathname === '/booking/success' || pathname === '/booking/failure') {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  if (isMaintenance()) {
    // Allow the maintenance page itself + SEO / favicon
    if (
      pathname === '/maintenance' ||
      pathname.startsWith('/maintenance/') ||
      pathname === '/robots.txt' ||
      pathname === '/sitemap.xml' ||
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/brand/')
    ) {
      return NextResponse.next();
    }

    // Bypass via secret token in the URL — useful for previewing the live
    // site while it's "down" for everyone else.
    const token = searchParams.get('maintenance_bypass');
    const expected = process.env.MAINTENANCE_BYPASS_TOKEN;
    if (token && expected && token === expected) {
      const url = req.nextUrl.clone();
      url.searchParams.delete('maintenance_bypass');
      const res = NextResponse.redirect(url);
      res.cookies.set(BYPASS_COOKIE, expected, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12 // 12 hours
      });
      return res;
    }
    if (expected && req.cookies.get(BYPASS_COOKIE)?.value === expected) {
      // Authenticated bypass: pass through normally
      return intlMiddleware(req);
    }

    // Everyone else gets redirected to /maintenance
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    url.search = '';
    return NextResponse.rewrite(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
