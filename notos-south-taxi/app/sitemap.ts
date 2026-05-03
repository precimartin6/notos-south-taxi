import type { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/lib/site-config';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://notosouthtaxi.gr';
const LOCALES = ['en', 'el'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    // Home
    entries.push({
      url: `${SITE}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0
    });

    // Static pages
    for (const path of ['destinations', 'booking', 'about']) {
      entries.push({
        url: `${SITE}/${locale}/${path}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8
      });
    }

    // One per destination
    for (const d of DESTINATIONS) {
      entries.push({
        url: `${SITE}/${locale}/destinations/${d.slug}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7
      });
    }

    // Legal pages
    for (const slug of ['terms', 'privacy', 'cookies', 'cancellation']) {
      entries.push({
        url: `${SITE}/${locale}/legal/${slug}`,
        lastModified: now,
        changeFrequency: 'yearly',
        priority: 0.3
      });
    }
  }

  return entries;
}
