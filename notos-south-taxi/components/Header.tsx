'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Menu, X, Phone, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { SITE } from '@/lib/site-config';

export default function Header() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const otherLocale = locale === 'en' ? 'el' : 'en';
  // Robust locale swap that works for /en, /en/foo, /en/foo/bar
  const switchedPath = pathname.replace(/^\/(en|el)(?=\/|$)/, `/${otherLocale}`);

  const linkBase = `/${locale}`;
  // Note: no "Book" link in nav — there's a yellow CTA on the right doing that job
  const links = [
    { href: `${linkBase}`, label: t('home') },
    { href: `${linkBase}/destinations`, label: t('destinations') },
    { href: `${linkBase}/services`, label: t('services') },
    { href: `${linkBase}/about`, label: t('about') }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-notos-blue/10 bg-notos-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <Logo />
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-notos-blue-deep">Notos South</div>
            <div className="-mt-0.5 text-[11px] tracking-[0.16em] text-notos-blue/70">TAXI · ATHENS</div>
          </div>
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
          <a
            href={`tel:${SITE.phone.replace(/\s/g, '')}`}
            className="hidden items-center gap-1.5 text-sm font-semibold text-notos-blue-deep xl:flex"
          >
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
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

function Logo() {
  return (
    <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-lg shadow-card">
      <img
        src="/brand/notos-logo-256.jpg"
        alt="Notos Taxi Service"
        className="h-full w-full object-cover"
        width={40}
        height={40}
      />
    </span>
  );
}
