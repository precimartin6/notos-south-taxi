import type { MetadataRoute } from 'next';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://notosouthtaxi.gr';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/booking/success', '/booking/failure']
      }
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE
  };
}
