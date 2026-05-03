'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { SITE } from '@/lib/site-config';
import { X } from 'lucide-react';

/**
 * Floating WhatsApp button bottom-right.
 * Tap → opens a small popup with two number choices, one per WABA-enabled mobile.
 */
export default function WhatsAppFab() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const greeting = locale === 'el'
    ? 'Γεια σας, θα ήθελα μια προσφορά για ταξί.'
    : "Hello, I'd like a taxi quote please.";
  const text = encodeURIComponent(greeting);
  const wa = (num: string) => `https://wa.me/${num.replace(/\D/g, '')}?text=${text}`;

  const numbers = [
    { label: SITE.phone, e164: SITE.whatsapp },
    { label: SITE.phoneAlt, e164: SITE.whatsappAlt }
  ];

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[280px] origin-bottom-right rounded-2xl border border-black/5 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-notos-blue-deep">
              {locale === 'el' ? 'Στείλτε WhatsApp' : 'Message us on WhatsApp'}
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-notos-blue-deep/50 hover:bg-notos-paper hover:text-notos-blue-deep">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-notos-blue-deep/65">
            {locale === 'el' ? 'Επιλέξτε αριθμό για να χρησιμοποιήσετε:' : 'Pick a number to chat:'}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {numbers.map((n) => (
              <a
                key={n.e164}
                href={wa(n.e164)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 px-3 py-2.5 text-sm font-semibold text-notos-blue-deep transition hover:bg-[#25D366]/10"
              >
                <span>{n.label}</span>
                <WAIcon />
              </a>
            ))}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366]"
      >
        <WAIcon className="h-7 w-7" />
      </button>
    </div>
  );
}

function WAIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}
