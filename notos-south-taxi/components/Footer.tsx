'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Facebook, Instagram, MapPin, Star } from 'lucide-react';
import { SITE } from '@/lib/site-config';

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  return (
    <footer className="mt-24 bg-notos-blue-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl font-bold">Notos South Taxi</div>
          <p className="mt-2 max-w-md text-white/70">{t('tagline')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
               className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-notos-yellow hover:text-notos-blue-deep">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
               className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-notos-yellow hover:text-notos-blue-deep">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={SITE.social.googleMaps1} target="_blank" rel="noopener noreferrer" aria-label="Google Maps"
               className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-notos-yellow hover:text-notos-blue-deep">
              <MapPin className="h-4 w-4" />
            </a>
            <a href={SITE.social.reviews} target="_blank" rel="noopener noreferrer" aria-label="Reviews"
               className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-notos-yellow hover:text-notos-blue-deep">
              <Star className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">{t('find')}</h4>
          <ul className="mt-3 space-y-2 text-white/85">
            {SITE.locations.map((loc) => (
              <li key={loc.address}>
                <a className="hover:text-notos-yellow" href={loc.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  {loc.label[locale as 'en' | 'el']}
                </a>
                <div className="text-xs text-white/55">{locale === 'el' ? loc.addressEl : loc.address}</div>
              </li>
            ))}
            <li className="pt-2 flex items-center gap-2">
              <a className="hover:text-notos-yellow" href={`tel:${SITE.phone.replace(/\s/g,'')}`}>{SITE.phone}</a>
              <WhatsAppBadge />
            </li>
            <li className="flex items-center gap-2">
              <a className="hover:text-notos-yellow" href={`tel:${SITE.phoneAlt.replace(/\s/g,'')}`}>{SITE.phoneAlt}</a>
              <WhatsAppBadge />
            </li>
            <li><a className="hover:text-notos-yellow" href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">{t('legal')}</h4>
          <ul className="mt-3 space-y-2 text-white/85">
            <li><Link className="hover:text-notos-yellow" href={`/${locale}/legal/terms`}>{t('terms')}</Link></li>
            <li><Link className="hover:text-notos-yellow" href={`/${locale}/legal/privacy`}>{t('privacy')}</Link></li>
            <li><Link className="hover:text-notos-yellow" href={`/${locale}/legal/cookies`}>{t('cookies')}</Link></li>
            <li><Link className="hover:text-notos-yellow" href={`/${locale}/legal/cancellation`}>{t('cancellation')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} Notos South Taxi · {t('rights')}</span>
          <span>{t('data_controller')} · VAT {SITE.vatId}</span>
        </div>
      </div>
    </footer>
  );
}

/** Small green WhatsApp tag shown next to phone numbers that are also on WhatsApp. */
function WhatsAppBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#25D366]">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
      </svg>
      WhatsApp
    </span>
  );
}
