'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function SuccessPage() {
  const t = useTranslations();
  const sp = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  // Viva will append `?t={transactionId}&s={state}&eventId={..}&eci={..}&orderCode={..}`
  const orderCode = sp.get('s') || sp.get('orderCode') || sp.get('t');

  const [bookingId, setBookingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    try { setBookingId(sessionStorage.getItem('notos_last_booking')); } catch {}
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    let stopped = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/booking/status?id=${encodeURIComponent(bookingId)}`);
        if (r.ok) {
          const d = await r.json();
          if (stopped) return;
          setStatus(d.status);
          setData(d);
          if (d.status === 'paid') return;
        }
      } catch {}
      if (!stopped) setTimeout(tick, 2000);
    };
    tick();
    return () => { stopped = true; };
  }, [bookingId]);

  const isPaid = status === 'paid';

  return (
    <section className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
      <div className="rounded-3xl border border-notos-blue/10 bg-white p-8 shadow-card text-center">
        {isPaid ? (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <h1 className="mt-3 font-display text-3xl font-black text-notos-blue-deep">{t('booking.successTitle')}</h1>
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
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-notos-blue" />
            <h1 className="mt-3 font-display text-3xl font-black text-notos-blue-deep">{t('booking.pendingTitle')}</h1>
            <p className="mt-3 text-notos-blue-deep/75">{t('booking.pendingBody')}</p>
          </>
        )}
      </div>
    </section>
  );
}
