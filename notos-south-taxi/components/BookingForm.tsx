'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Loader2, MapPin, Phone } from 'lucide-react';
import type { Locale } from '@/i18n';
import { SITE } from '@/lib/site-config';
import { vehicleNeedsAdvanceNotice, VAN_MIN_NOTICE_MINUTES } from '@/lib/pricing';

interface Props {
  locale: Locale;
  destinations: { slug: string; label: string }[];
  defaultFrom: string;
  defaultTo: string;
}

interface Quote {
  totalEUR: number;
  depositEUR: number;
  remainderEUR: number;
  breakdown: { label: string; amountEUR: number }[];
  source: 'fixed' | 'distance';
  estimatedKm?: number;
}

interface Suggestion {
  formatted: string;
  lat: number;
  lon: number;
  placeId?: string;
}

const CUSTOM = '__custom__';

/**
 * Pickup/destination field that's either a select (for known places) OR a
 * Geoapify autocomplete input (for custom addresses). Toggled by the
 * "Type an address" option in the select.
 */
function PlaceField({
  label,
  value,
  onChange,
  customValue,
  onCustomChange,
  destinations,
  selectPlaceholder,
  customPlaceholder,
  customLabel,
  excludeSlug,
  locale
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  destinations: { slug: string; label: string }[];
  selectPlaceholder: string;
  customPlaceholder: string;
  customLabel: string;
  excludeSlug?: string;
  locale: Locale;
}) {
  const isCustom = value === CUSTOM;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch on custom input
  useEffect(() => {
    if (!isCustom) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (customValue.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `/api/places-autocomplete?q=${encodeURIComponent(customValue)}&lang=${locale}`
        );
        const data = await r.json();
        setSuggestions(Array.isArray(data?.results) ? data.results : []);
        setShowDropdown(true);
        setHighlight(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [customValue, isCustom, locale]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function pick(s: Suggestion) {
    onCustomChange(s.formatted);
    setShowDropdown(false);
    setSuggestions([]);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      pick(suggestions[highlight]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="label">{label}</label>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{selectPlaceholder}</option>
        {destinations.filter((d) => d.slug !== excludeSlug).map((d) => (
          <option key={d.slug} value={d.slug}>{d.label}</option>
        ))}
        <option value={CUSTOM}>— {customLabel} —</option>
      </select>

      {isCustom && (
        <div className="relative mt-2">
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-notos-blue/40" />
            <input
              type="text"
              className="input pl-9"
              value={customValue}
              onChange={(e) => onCustomChange(e.target.value)}
              onKeyDown={onKey}
              onFocus={() => suggestions.length && setShowDropdown(true)}
              placeholder={customPlaceholder}
              autoComplete="off"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-notos-blue/50" />
            )}
          </div>

          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-notos-blue/15 bg-white shadow-lg">
              {suggestions.map((s, i) => (
                <li
                  key={s.placeId || `${s.lat},${s.lon},${i}`}
                  onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`cursor-pointer px-4 py-2.5 text-sm transition ${
                    i === highlight
                      ? 'bg-notos-yellow/20 text-notos-blue-deep'
                      : 'text-notos-blue-deep/85 hover:bg-notos-paper'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-notos-blue/60" />
                    <span>{s.formatted}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingForm({ locale, destinations, defaultFrom, defaultTo }: Props) {
  const t = useTranslations('form');

  const tomorrow = useMemo(() => {
    const d = new Date(Date.now() + 24 * 3600 * 1000);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  }, []);

  const [fromSlug, setFromSlug] = useState(defaultFrom || 'airport');
  const [toSlug, setToSlug] = useState(defaultTo || '');
  const [fromAddr, setFromAddr] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [pickupAt, setPickupAt] = useState(tomorrow);
  const [vehicle, setVehicle] = useState<'taxi' | 'station_wagon' | 'van' | 'coach'>('taxi');
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(2);
  const [bigLuggage, setBigLuggage] = useState(0);
  const [childSeats, setChildSeats] = useState(0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vanNoticeRef = useRef<HTMLDivElement>(null);

  const usingCustomFrom = fromSlug === CUSTOM;
  const usingCustomTo = toSlug === CUSTOM;

  // Cap passengers based on vehicle
  const passengerCap = vehicle === 'coach' ? 24 : vehicle === 'van' ? 8 : 4;
  useEffect(() => {
    if (passengers > passengerCap) setPassengers(passengerCap);
  }, [vehicle, passengerCap]); // eslint-disable-line

  // Vans / coaches need ≥ 1h notice. Recompute on vehicle/time change.
  const vanNoticeIssue = useMemo(() => {
    if (!vehicleNeedsAdvanceNotice(vehicle)) return false;
    const pickupMs = new Date(pickupAt).getTime();
    if (Number.isNaN(pickupMs)) return false;
    const minutesUntil = (pickupMs - Date.now()) / 60000;
    return minutesUntil < VAN_MIN_NOTICE_MINUTES;
  }, [vehicle, pickupAt]);

  function payload() {
    return {
      fromSlug: usingCustomFrom ? undefined : fromSlug,
      toSlug: usingCustomTo ? undefined : toSlug,
      fromAddress: usingCustomFrom ? fromAddr : undefined,
      toAddress: usingCustomTo ? toAddr : undefined,
      vehicle,
      passengers,
      luggage,
      bigLuggage,
      childSeats,
      pickupAtIso: new Date(pickupAt).toISOString()
    };
  }

  async function getQuote() {
    setError(null);
    if (usingCustomFrom && fromAddr.trim().length < 3) {
      setError(t('errors.required'));
      return;
    }
    if (!toSlug || (usingCustomTo && toAddr.trim().length < 3)) {
      setError(t('errors.required'));
      return;
    }
    setLoadingQuote(true);
    try {
      const r = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload())
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'quote_failed');
      setQuote(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoadingQuote(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms || !acceptedPrivacy) {
      setError(t('errors.required'));
      return;
    }
    if (vanNoticeIssue) {
      // Hard-block: scroll the warning into view (already visible since vanNoticeIssue is true)
      vanNoticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    try {
      const fromLabel = usingCustomFrom
        ? fromAddr
        : destinations.find((d) => d.slug === fromSlug)?.label || fromSlug;
      const toLabel = usingCustomTo
        ? toAddr
        : destinations.find((d) => d.slug === toSlug)?.label || toSlug;

      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload(),
          locale,
          fromLabel,
          toLabel,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          flightNumber: flightNumber || undefined,
          notes: notes || undefined,
          acceptedTerms: true,
          acceptedPrivacy: true
        })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || 'booking_failed');
      try { sessionStorage.setItem('notos_last_booking', data.bookingId); } catch {}
      window.location.href = data.checkoutUrl;
    } catch (e: any) {
      setError(t('errors.submit'));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-notos-blue/10 bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceField
          label={t('from')}
          value={fromSlug}
          onChange={setFromSlug}
          customValue={fromAddr}
          onCustomChange={setFromAddr}
          destinations={destinations}
          selectPlaceholder={t('selectFrom')}
          customPlaceholder={t('customAddressPlaceholder')}
          customLabel={t('customAddress')}
          excludeSlug={toSlug !== CUSTOM ? toSlug : undefined}
          locale={locale}
        />
        <PlaceField
          label={t('to')}
          value={toSlug}
          onChange={setToSlug}
          customValue={toAddr}
          onCustomChange={setToAddr}
          destinations={destinations}
          selectPlaceholder={t('selectTo')}
          customPlaceholder={t('customAddressPlaceholder')}
          customLabel={t('customAddress')}
          excludeSlug={fromSlug !== CUSTOM ? fromSlug : undefined}
          locale={locale}
        />

        <div>
          <label className="label">{t('pickupDate')}</label>
          <input
            type="datetime-local"
            className="input"
            value={pickupAt}
            onChange={(e) => setPickupAt(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">{t('vehicle')}</label>
          <select className="input" value={vehicle} onChange={(e) => setVehicle(e.target.value as any)}>
            <option value="taxi">{t('vehicles.taxi')}</option>
            <option value="station_wagon">{t('vehicles.station_wagon')}</option>
            <option value="van">{t('vehicles.van')}</option>
            <option value="coach">{t('vehicles.coach')}</option>
          </select>
        </div>

        <div>
          <label className="label">{t('passengers')}</label>
          <input
            type="number"
            min={1}
            max={passengerCap}
            className="input"
            value={passengers}
            onChange={(e) => setPassengers(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t('luggage')}</label>
          <input
            type="number"
            min={0}
            max={30}
            className="input"
            value={luggage}
            onChange={(e) => setLuggage(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t('bigLuggage')}</label>
          <input
            type="number"
            min={0}
            max={15}
            className="input"
            value={bigLuggage}
            onChange={(e) => setBigLuggage(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t('childSeats')}</label>
          <input
            type="number"
            min={0}
            max={4}
            className="input"
            value={childSeats}
            onChange={(e) => setChildSeats(Number(e.target.value))}
          />
        </div>
      </div>

      <hr className="my-7 border-notos-blue/10" />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">{t('name')}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">{t('email')}</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">{t('phone')}</label>
          <input
            type="tel"
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+30…"
            required
          />
        </div>
        <div>
          <label className="label">{t('flightNumber')}</label>
          <input
            className="input"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
            placeholder="A3 — 600"
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">{t('notes')}</label>
          <textarea
            className="input min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={getQuote} disabled={loadingQuote} className="btn-ghost">
          {loadingQuote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('getQuote')}
        </button>
      </div>

      {quote && (
        <div className="mt-6 rounded-2xl bg-notos-paper p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-notos-blue-deep/60">{t('quote.total')}</div>
              <div className="font-display text-2xl font-bold text-notos-blue-deep">€{quote.totalEUR.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-notos-blue-deep/60">{t('quote.deposit')}</div>
              <div className="font-display text-2xl font-bold text-notos-blue-deep">€{quote.depositEUR.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-notos-blue-deep/60">{t('quote.remainder')}</div>
              <div className="font-display text-2xl font-bold text-notos-blue-deep">€{quote.remainderEUR.toFixed(2)}</div>
            </div>
          </div>
          <ul className="mt-4 divide-y divide-notos-blue/10 text-sm">
            {quote.breakdown.map((b, i) => (
              <li key={i} className="flex items-center justify-between py-1.5">
                <span className="text-notos-blue-deep/80">{b.label}</span>
                <span className="font-medium text-notos-blue-deep">€{b.amountEUR.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-notos-blue-deep/60">{t('quote.noShows')}</p>
        </div>
      )}

      <div className="mt-6 space-y-2">
        <label className="flex items-start gap-2 text-sm text-notos-blue-deep/85">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
          />
          <span>
            {locale === 'el' ? 'Αποδέχομαι τους ' : 'I accept the '}
            <Link className="underline" href={`/${locale}/legal/terms`} target="_blank">
              {t('termsLink')}
            </Link>
            {locale === 'el' ? ' και την ' : ' and the '}
            <Link className="underline" href={`/${locale}/legal/cancellation`} target="_blank">
              {t('cancellationLink')}
            </Link>.
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-notos-blue-deep/85">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={acceptedPrivacy}
            onChange={(e) => setAcceptedPrivacy(e.target.checked)}
          />
          <span>
            {locale === 'el' ? 'Αποδέχομαι την ' : 'I accept the '}
            <Link className="underline" href={`/${locale}/legal/privacy`} target="_blank">
              {t('privacyLink')}
            </Link>.
          </span>
        </label>
      </div>

      {vanNoticeIssue ? (
        <div ref={vanNoticeRef} className="mt-5 rounded-2xl border border-amber-300/70 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-amber-900">!</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-900">
                {locale === 'el'
                  ? (vehicle === 'coach'
                      ? 'Τα λεωφορεία χρειάζονται τουλάχιστον 1 ώρα προειδοποίηση'
                      : 'Τα βαν χρειάζονται τουλάχιστον 1 ώρα προειδοποίηση')
                  : (vehicle === 'coach'
                      ? 'Coaches need at least 1 hour notice'
                      : 'Vans need at least 1 hour notice')}
              </div>
              <p className="mt-1 text-sm text-amber-900/85">
                {locale === 'el'
                  ? 'Επιλέξτε ώρα παραλαβής τουλάχιστον 1 ώρα μετά, ή καλέστε / στείλτε WhatsApp για να το κανονίσουμε αμέσως.'
                  : 'Pick a time at least 1 hour from now, or call / WhatsApp us and we\'ll arrange it right away.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, '')}`}
                  className="inline-flex items-center gap-2 rounded-full bg-notos-blue-deep px-4 py-2 text-sm font-semibold text-notos-yellow transition hover:bg-notos-blue"
                >
                  <Phone className="h-4 w-4" /> {SITE.phone}
                </a>
                <a
                  href={`https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    locale === 'el'
                      ? `Γεια σας, χρειάζομαι ${vehicle === 'coach' ? 'λεωφορείο' : 'βαν'} σύντομα.`
                      : `Hello, I need a ${vehicle === 'coach' ? 'coach' : 'van'} soon.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe57]"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {error && error !== '__van_notice__' && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || vanNoticeIssue}
        className="btn-primary mt-6 w-full text-base disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t('submit')}
      </button>
    </form>
  );
}
