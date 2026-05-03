'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const KEY = 'notos_cookies_v1';

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-notos-blue/15 bg-white p-4 shadow-card sm:flex sm:items-center sm:gap-4 sm:p-5">
      <p className="flex-1 text-sm text-notos-blue-deep/85">{t('text')}</p>
      <button
        onClick={() => {
          try { localStorage.setItem(KEY, '1'); } catch {}
          setShow(false);
        }}
        className="btn-primary mt-3 w-full sm:mt-0 sm:w-auto"
      >
        {t('accept')}
      </button>
    </div>
  );
}
