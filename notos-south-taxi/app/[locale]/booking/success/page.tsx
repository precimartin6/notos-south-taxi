'use client';

import { Suspense, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { SITE } from '@/lib/site-config';

const MAX_POLL_MS = 30_000; // 30 seconds, then stop and show "verification pending" UI
const POLL_INTERVAL_MS = 2000;

function SuccessContent() {
  const t = useTranslations();
  const sp = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Viva can hand the orderCode back under several names depending on which
  // success URL template was set up in the merchant dashboard.
  const orderCode = sp.get('s') || sp.get('orderCode') || sp.get('t') || sp.get('OrderCode');

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'paid' | 'cancelled' | 'gave-up'>('pending');
  const [data, setData] = useState<any>(null);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    try { setBookingId(sessionStorage.getItem('notos_last_booking')); } catch {}
  }, []);

  useEffect(() => {
    // Need at least one of the two to ask the server anything useful
    if (!bookingId && !orderCode) return;

    let stopped = false;
    let timer: any;

    const tick = async () => {
      // Hard timeout — stop polling after 30s and show the "we got it, just
      // verifying" fallback UI. The booking still completes server-side via
      // the webhook; we just stop spinning at the user.
      if (Date.now() - startedAt > MAX_POLL_MS) {
        if (!stopped) setStatus('gave-up');
        return;
      }

      try {
        const params = new URLSearchParams();
        if (bookingId)  params.set('id', bookingId);
        if (orderCode)  params.set('orderCode', orderCode);
        const r = await fetch(`/api/booking/status?${params.toString()}`);
        if (r.ok) {
          const d = await r.json();
          if (stopped) return;
          setData(d);
          if (d.status === 'paid') {
            setStatus('paid');
            return;
          }
          if (d.status === 'cancelled') {
            setStatus('cancelled');
            return;
          }
        }
      } catch {}
      if (!stopped) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };
    tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [bookingId, orderCode, startedAt]);

  // ---- RENDER ---------------------------------------------------------

  if (status === 'paid') {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl border border-notos-blue/10 bg-white p-8 shadow-card text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-3 font-display text-3xl font-black text-notos-blue-deep">
            {t('booking.successTitle')}
          </h1>
          <p className="mt-3 text-notos-blue-deep/75">
            {t('booking.successBody', {
              name: '',
              id: bookingId || orderCode || '—',
              remainder: data?.remainderEUR?.toFixed?.(2) || '—'
            })}
          </p>
          <Link href={`/${locale}`} className="btn-primary mt-7">
            {t('booking.successCta')}
          </Link>
        </div>
      </section>
    );
  }

  if (status === 'cancelled') {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-card text-center">
          <h1 className="mt-3 font-display text-3xl font-black text-rose-700">
            {locale === 'el' ? 'Η πληρωμή απέτυχε' : 'Payment failed'}
          </h1>
          <p className="mt-3 text-rose-900/80">
            {locale === 'el'
              ? 'Η πληρωμή δεν ολοκληρώθηκε. Μπορείτε να δοκιμάσετε ξανά ή να επικοινωνήσετε μαζί μας.'
              : "Your payment didn't go through. You can try again or get in touch."}
          </p>
          <Link href={`/${locale}/booking`} className="btn-primary mt-7">
            {locale === 'el' ? 'Νέα κράτηση' : 'New booking'}
          </Link>
        </div>
      </section>
    );
  }

  // The "we couldn't confirm in 30 seconds, but the booking is in our system" fallback.
  // This is the user-friendly version of the old infinite spinner.
  if (status === 'gave-up') {
    return (
      <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-card text-center">
          <Clock className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-3 font-display text-3xl font-black text-notos-blue-deep">
            {locale === 'el' ? 'Η κράτησή σας έχει καταχωρηθεί' : 'Your booking is in'}
          </h1>
          <p className="mt-3 text-notos-blue-deep/80">
            {locale === 'el'
              ? `Έχουμε λάβει την κράτησή σας${bookingId || orderCode ? ` (αρ. ${bookingId || orderCode})` : ''}. Η επιβεβαίωση πληρωμής μπορεί να καθυστερήσει λίγα λεπτά. Θα λάβετε επιβεβαίωση WhatsApp/email μόλις πιστωθεί η προκαταβολή. Αν έχετε αμφιβολία, καλέστε μας απευθείας.`
              : `We've received your booking${bookingId || orderCode ? ` (ref ${bookingId || orderCode})` : ''}. Payment confirmation can take a couple of minutes to come through. You'll get a WhatsApp/email confirmation once the deposit clears. If in doubt, call us directly.`}
          </p>
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="btn-primary">
              {locale === 'el' ? 'Καλέστε μας' : 'Call us'} {SITE.phone}
            </a>
            <Link href={`/${locale}`} className="btn-ghost">
              {locale === 'el' ? 'Αρχική' : 'Home'}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Default: still polling
  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <div className="rounded-3xl border border-notos-blue/10 bg-white p-8 shadow-card text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-notos-blue" />
        <h1 className="mt-3 font-display text-3xl font-black text-notos-blue-deep">
          {t('booking.pendingTitle')}
        </h1>
        <p className="mt-3 text-notos-blue-deep/75">{t('booking.pendingBody')}</p>
      </div>
    </section>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-notos-blue" />
      </section>
    }>
      <SuccessContent />
    </Suspense>
  );
}
