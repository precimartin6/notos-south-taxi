'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Phone, Pencil } from 'lucide-react';
import { SITE } from '@/lib/site-config';

interface EditableFields {
  pickupAtIso: string;
  flightNumber?: string;
  notes?: string;
  passengers: number;
  luggage: number;
  childSeats: number;
  customerPhone: string;
  fromText: string;
  toText: string;
  vehicle: string;
}

type Phase =
  | 'collapsed'
  | 'email'
  | 'loading'
  | 'form'
  | 'window_passed'
  | 'cancelled'
  | 'not_found'
  | 'saving'
  | 'saved'
  | 'save_error';

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditBookingSection({
  bookingId,
  initialEmail
}: {
  bookingId: string;
  initialEmail?: string;
}) {
  const t = useTranslations('booking.edit');

  const [phase, setPhase] = useState<Phase>('collapsed');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [fields, setFields] = useState<EditableFields | null>(null);
  const [pickupAt, setPickupAt] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [childSeats, setChildSeats] = useState(0);
  const [phone, setPhone] = useState('');
  const [vanNotice, setVanNotice] = useState(false);

  async function load() {
    setPhase('loading');
    try {
      const r = await fetch('/api/booking/edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: bookingId, email })
      });
      const data = await r.json();
      if (!r.ok) {
        setPhase(data?.error === 'cancelled' ? 'cancelled' : 'not_found');
        return;
      }
      const f: EditableFields = data.fields;
      setFields(f);
      setPickupAt(toDatetimeLocal(f.pickupAtIso));
      setFlightNumber(f.flightNumber ?? '');
      setNotes(f.notes ?? '');
      setPassengers(f.passengers);
      setLuggage(f.luggage);
      setChildSeats(f.childSeats);
      setPhone(f.customerPhone ?? '');
      setPhase(data.editable ? 'form' : 'window_passed');
    } catch {
      setPhase('not_found');
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setVanNotice(false);
    setPhase('saving');
    try {
      const r = await fetch('/api/booking/edit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: bookingId,
          email,
          patch: {
            pickupAtIso: new Date(pickupAt).toISOString(),
            flightNumber: flightNumber || undefined,
            notes: notes || undefined,
            passengers,
            luggage,
            childSeats,
            customerPhone: phone
          }
        })
      });
      const data = await r.json();
      if (!r.ok) {
        if (data?.error === 'van_notice') {
          setVanNotice(true);
          setPhase('form');
          return;
        }
        if (data?.error === 'edit_window_passed') {
          setPhase('window_passed');
          return;
        }
        setPhase('save_error');
        return;
      }
      setFields(data.fields);
      setPhase('saved');
    } catch {
      setPhase('save_error');
    }
  }

  if (phase === 'collapsed') {
    return (
      <button
        type="button"
        onClick={() => setPhase('email')}
        className="btn-ghost mt-4 w-full text-sm"
      >
        <Pencil className="h-4 w-4" /> {t('toggle')}
      </button>
    );
  }

  const contactButtons = (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
      <a
        href={`tel:${SITE.phone.replace(/\s/g, '')}`}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-notos-blue-deep px-5 py-2.5 text-sm font-semibold text-notos-yellow"
      >
        <Phone className="h-4 w-4" /> {SITE.phone}
      </a>
      <a
        href={`https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
      >
        💬 WhatsApp
      </a>
    </div>
  );

  return (
    <div className="mt-6 rounded-2xl border border-notos-blue/10 bg-notos-paper p-5 text-left">
      <p className="text-sm font-semibold text-notos-blue-deep">{t('toggle')}</p>
      <p className="mt-1 text-xs text-notos-blue-deep/60">{t('toggleHint')}</p>

      {(phase === 'email' || phase === 'loading') && (
        <div className="mt-4">
          <label className="label">{t('emailLabel')}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={load}
              disabled={phase === 'loading' || !email}
              className="btn-primary shrink-0"
            >
              {phase === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('loadBtn')}
            </button>
          </div>
        </div>
      )}

      {phase === 'not_found' && (
        <p className="mt-4 text-sm text-red-600">{t('loadError')}</p>
      )}

      {phase === 'cancelled' && (
        <p className="mt-4 text-sm text-red-600">{t('cancelledNotice')}</p>
      )}

      {phase === 'window_passed' && (
        <>
          <p className="mt-4 text-sm text-amber-700">{t('windowPassed')}</p>
          {contactButtons}
        </>
      )}

      {(phase === 'form' || phase === 'saving' || phase === 'save_error' || phase === 'saved') && fields && (
        <form onSubmit={save} className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">{t('pickupLabel')}</label>
              <input
                type="datetime-local"
                className="input"
                value={pickupAt}
                onChange={(e) => setPickupAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t('phoneLabel')}</label>
              <input
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">{t('flightLabel')}</label>
              <input
                className="input"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="label">{t('passengersLabel')}</label>
              <input
                type="number"
                min={1}
                max={24}
                className="input"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">{t('luggageLabel')}</label>
              <input
                type="number"
                min={0}
                max={20}
                className="input"
                value={luggage}
                onChange={(e) => setLuggage(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">{t('childSeatsLabel')}</label>
              <input
                type="number"
                min={0}
                max={4}
                className="input"
                value={childSeats}
                onChange={(e) => setChildSeats(Number(e.target.value))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">{t('notesLabel')}</label>
              <textarea
                className="input min-h-[70px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-notos-blue-deep/60">{t('routeNotice')}</p>

          {vanNotice && (
            <p className="mt-2 text-sm text-amber-700">{t('vanNotice')}</p>
          )}
          {phase === 'save_error' && (
            <p className="mt-2 text-sm text-red-600">{t('saveError')}</p>
          )}
          {phase === 'saved' && (
            <p className="mt-2 text-sm text-emerald-700">{t('saved')}</p>
          )}

          <button
            type="submit"
            disabled={phase === 'saving'}
            className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {phase === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('saveBtn')}
          </button>
        </form>
      )}
    </div>
  );
}
