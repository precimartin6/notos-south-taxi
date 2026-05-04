/**
 * Shared routing config — imported by BOTH middleware and i18n.ts.
 * Must NOT import anything from 'next-intl/server', 'next/navigation',
 * or any other server/Node-only module, because middleware runs on the
 * Edge runtime where those modules are unavailable.
 */

export const locales = ['en', 'el'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';
