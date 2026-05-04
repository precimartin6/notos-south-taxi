'use client';

import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import type { Locale } from '@/i18n';

/**
 * Placeholder reviews. SWAP THESE for Martin's real Google reviews when available.
 * To swap: replace the entries in REVIEWS below. Keep the same shape.
 *   - 3-6 reviews works best (more = users never see the later ones; fewer = boring)
 *   - quote: ~30-60 words is the sweet spot — long enough to feel substantive, short enough to read at a glance
 *   - name: first name only (privacy + warmth)
 *   - origin: where the reviewer is from, optional, can be country or city
 *   - stars: 5 unless we have a 4-star review worth showing for credibility (one mixed review actually increases trust)
 *
 * IMPORTANT: these are placeholders, NOT real reviews. Don't ship to production until swapped.
 */
const REVIEWS: { quote: { en: string; el: string }; name: string; origin?: string; stars: 1|2|3|4|5 }[] = [
  {
    quote: {
      en: "Excellent service. Very friendly guide who showed me everything about Athens. Always punctual, offered many services. I'm grateful Greece has such professionals.",
      el: "Εξαιρετική υπηρεσία. Πολύ φιλικός οδηγός που μου έδειξε τα πάντα για την Αθήνα. Πάντα στην ώρα του, πρόσφερε πολλές υπηρεσίες. Χαίρομαι που η Ελλάδα έχει τέτοιους επαγγελματίες"
    },
    name: 'Arisfaerio',
    origin: 'Greece',
    stars: 5
  },
  {
    quote: {
      en: "Excellent driver, waited until I got inside my house before leaving!!!!",
      el: "Εξαιρετικός οδηγός, περίμενε μέχρι να μπω και στο σπίτι και μετά έφυγε!!!!"
    },
    name: 'Veatriki Papadopoulou',
    origin: 'Greece',
    stars: 5
  },
  {
    quote: {
      en: "Impeccable driver, polite, with great morals. The car is in excellent condition, comfortable and clean!",
      el: "Άψογος οδηγός, ευγενέστατος, με τρομερό ήθος. Το αυτοκίνητο σε άριστη κατάσταση, άνετο και καθαρό!"
    },
    name: 'Αντζελ Μπιν',
    origin: 'Greece',
    stars: 5
  },
  {
    quote: {
      en: "Great driver. Very enjoyable during the drive. On time and waited for me to return me back",
      el: "Υπέροχος οδηγός. Πολύ ευχάριστος κατά τη διαδρομή. Στην ώρα του και περίμενε να με επιστρέψει"
    },
    name: 'Xhaferr Cakoni',
    origin: 'Greece',
    stars: 5
  },
  {
    quote: {
      en: "Punctuality, humour and above all cleanliness!! Highly recommended!!",
      el: "Συνέπεια, χιούμορ και προπάντων καθαριότητα!! Συνιστώ ανεπιφύλακτα!!"
    },
    name: 'Αθηνά Σιμάκου',
    origin: 'Greece',
    stars: 5
  }
];

const ROTATION_MS = 6000;

export default function ReviewsCarousel({ locale }: { locale: Locale }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Rotate
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      setCurrent((c) => (c + 1) % REVIEWS.length);
    }, ROTATION_MS);
    return () => clearInterval(t);
  }, [paused]);

  const r = REVIEWS[current];

  return (
    <div
      className="relative rounded-3xl bg-notos-blue-deep p-6 shadow-card sm:p-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* "What our riders say" header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-notos-yellow px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-notos-blue-deep">
            {locale === 'el' ? 'Τι λένε οι πελάτες' : 'What riders say'}
          </span>
        </div>
        <GoogleBadge />
      </div>

      {/* The quote — fade animation between reviews */}
      <div ref={cardRef} className="relative min-h-[320px] sm:min-h-[320px]">
        {REVIEWS.map((review, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={i !== current}
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= review.stars ? 'fill-notos-yellow text-notos-yellow' : 'text-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Quote */}
            <blockquote className="mt-4 font-display text-lg leading-relaxed text-white sm:text-xl">
              &ldquo;{review.quote[locale]}&rdquo;
            </blockquote>

            {/* Reviewer */}
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-notos-yellow font-display text-base font-bold text-notos-blue-deep">
                {review.name[0]}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{review.name}</div>
                {review.origin && (
                  <div className="text-xs text-white/60">{review.origin}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators — clickable */}
      <div className="mt-2 flex gap-1.5">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show review ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? 'w-8 bg-notos-yellow' : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/** Small "via Google" badge — uses Google's official colours so it reads as the real thing */
function GoogleBadge() {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      <span>{`via Google`}</span>
    </div>
  );
}
