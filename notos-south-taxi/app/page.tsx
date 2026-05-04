/**
 * Fallback root route — should normally never be reached because the
 * middleware redirects "/" → "/en" before the request gets here.
 * If it IS reached (e.g. middleware misconfiguration), redirect to the
 * default locale so the site still works.
 */
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/routing';

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
