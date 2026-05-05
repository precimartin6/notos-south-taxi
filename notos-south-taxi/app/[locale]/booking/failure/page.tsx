'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function BookingFailurePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-card text-center">
        <h1 className="font-display text-3xl font-black text-rose-700">
          {locale === 'el' ? 'Η πληρωμή δεν ολοκληρώθηκε' : 'Payment was not completed'}
        </h1>
        <p className="mt-3 text-rose-900/80">
          {locale === 'el'
            ? 'Η κάρτα σας δεν χρεώθηκε. Μπορείτε να δοκιμάσετε ξανά ή να επικοινωνήσετε μαζί μας.'
            : 'Your card was not charged. You can try again or contact us directly.'}
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href={`/${locale}/booking`} className="btn-primary">
            {locale === 'el' ? 'Δοκιμάστε ξανά' : 'Try again'}
          </Link>
          <Link href={`/${locale}`} className="btn-ghost">
            {locale === 'el' ? 'Αρχική' : 'Home'}
          </Link>
        </div>
      </div>
    </section>
  );
}
