const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n.ts');

// Static, nonce-free Content-Security-Policy. Kept nonce-free so routes can stay
// statically prerendered; 'unsafe-inline' is the documented tradeoff for Next's
// App Router hydration bootstrap. The allowlist covers exactly what this site
// loads: Google Fonts (fonts.googleapis.com stylesheet + fonts.gstatic.com font
// files, both referenced from app/layout.tsx) and Vercel Analytics (served
// first-party from /_vercel/* on Vercel, with va.vercel-scripts.com /
// vitals.vercel-insights.com as CDN fallbacks). All images are self-hosted
// (/photos, /brand), so img-src is 'self' data: only. Viva Wallet, Geoapify and
// Google Maps are only ever called server-side, so they need no browser
// directives.
//
// If you add a client-side script, embed, font host, image origin, or an API the
// browser must reach, add its origin to the matching directive here or it will be
// blocked in production. Test CSP changes against `next build && next start`, not
// `next dev` (dev uses eval/inline for HMR and reports false violations).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self' https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strip console.* from production builds so booking/payment logs (which
  // include customer email and Viva/booking identifiers) never land in
  // server logs. error/warn are kept for genuine error monitoring.
  compiler: {
    removeConsole: { exclude: ['error', 'warn'] }
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  }
};

module.exports = withNextIntl(nextConfig);
