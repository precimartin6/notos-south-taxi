export const dynamic = 'force-dynamic';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppFab from '@/components/WhatsAppFab';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  if (!locales.includes(locale)) notFound();
  const messages = await getMessages();

export default function Layout({ children }) {
  return <div>{children}</div>;
}

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <CookieBanner />
      <WhatsAppFab />
    </NextIntlClientProvider>
  );
}
