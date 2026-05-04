'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { SITE } from '@/lib/site-config';

const PHONE2 = '+30 698 451 1006';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === 'en' ? 'el' : 'en';
  const switchedPath = pathname.replace(/^\/(en|el)(?=\/|$)/, `/${otherLocale}`);

  const linkBase = `/${locale}`;
  const links = [
    { href: `${linkBase}`, label: t('home') },
    { href: `${linkBase}/destinations`, label: t('destinations') },
    { href: `${linkBase}/services`, label: t('services') },
    { href: `${linkBase}/about`, label: t('about') }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-notos-blue/10 bg-notos-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center">
          <img
            src="/brand/notos-logo-new.png"
            alt="Notos South Taxi"
            className="h-20 w-20 object-contain"
            width={300}
            height={72}
          />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-notos-blue-deep/80 transition hover:text-notos-blue-deep"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="hidden flex-col gap-0.5 xl:flex">
            <a
              href={`tel:${SITE.phone.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-notos-blue-deep"
            >
              <Phone className="h-4 w-4" /> {SITE.phone}
            </a>
            <a
              href={`tel:${PHONE2.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-notos-blue-deep"
            >
              <Phone className="h-4 w-4" /> {PHONE2}
            </a>
          </div>
          <Link
            href={switchedPath}
            className="rounded-full border border-notos-blue/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-notos-blue-deep transition hover:border-notos-blue/50"
          >
            {otherLocale === 'en' ? 'EN' : 'ΕΛ'}
          </Link>
          <Link
            href={`/${locale}/booking`}
            className="inline-flex items-center gap-2 rounded-full bg-notos-blue-deep px-5 py-2.5 text-sm font-semibold text-notos-yellow transition hover:bg-notos-blue"
          >
            {t('book')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-notos-blue/15 p-2 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-notos-blue/10 bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-1 font-medium">
                {l.label}
              </Link>
            ))}
            <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm font-semibold text-notos-blue-deep">
              <Phone className="h-4 w-4" /> {SITE.phone}
            </a>
            <a href={`tel:${PHONE2.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm font-semibold text-notos-blue-deep">
              <Phone className="h-4 w-4" /> {PHONE2}
            </a>
            <Link
              href={`/${locale}/booking`}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-notos-blue-deep px-5 py-2.5 text-sm font-semibold text-notos-yellow"
            >
              {t('book')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={switchedPath}
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex w-fit rounded-full border border-notos-blue/20 px-3 py-1 text-xs font-bold uppercase"
            >
              {otherLocale === 'en' ? 'EN' : 'ΕΛ'}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
