import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://notosouthtaxi.gr';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Notos South Taxi — Athens transfers & private taxi tours',
    template: '%s · Notos South Taxi'
  },
  description:
    'Licensed Athens taxi based on the Riviera. Airport transfers, day tours, sightseeing. Fixed prices, 15% online deposit, the rest in cash. 24/7.',
  applicationName: 'Notos South Taxi',
  authors: [{ name: 'Martin Preci' }],
  keywords: [
    'Athens taxi', 'Athens airport transfer', 'Vouliagmeni taxi', 'Glyfada taxi',
    'Athens to Sounion taxi', 'Athens to Meteora', 'Athens private taxi tour',
    'taxi Vouliagmeni', 'taxi Athens airport', 'Riviera taxi'
  ],
  // Favicon set — all sizes point to the current logo
  icons: {
    icon: [
      { url: '/brand/notos-logo-new.png', type: 'image/png', sizes: 'any' }
    ],
    apple: [{ url: '/brand/notos-logo-new.png', sizes: '180x180', type: 'image/png' }]
  },
  manifest: '/site.webmanifest',
  // Social / OG
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    alternateLocale: 'el_GR',
    url: SITE_URL,
    siteName: 'Notos South Taxi',
    title: 'Notos South Taxi — Athens transfers & private taxi tours',
    description:
      'Licensed Athens taxi based on the Riviera. Fixed prices, on time, every time.',
    images: [
      {
        url: '/photos/fleet/taxi-1.jpg',
        width: 1400,
        height: 933,
        alt: 'Notos South Taxi — yellow Mercedes E-Class at the Acropolis'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notos South Taxi — Athens transfers & private taxi tours',
    description:
      'Licensed Athens taxi based on the Riviera. Fixed prices, on time, every time.',
    images: ['/photos/fleet/taxi-1.jpg']
  },
  robots: { index: true, follow: true }
};

export const viewport = {
  themeColor: '#FFC72C',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,700;9..144,900&family=Inter+Tight:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
