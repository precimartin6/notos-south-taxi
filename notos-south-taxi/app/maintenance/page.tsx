import { SITE } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Notos South Taxi — Brief site maintenance',
  robots: { index: false, follow: false }
};

export default function MaintenancePage() {
  const phone1Tel = SITE.phone.replace(/\s/g, '');
  const phone2Tel = SITE.phoneAlt.replace(/\s/g, '');
  const wa1 = SITE.whatsapp.replace(/\D/g, '');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF7EE',
        color: '#06245A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: 'Inter Tight, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 540,
          width: '100%',
          background: 'white',
          borderRadius: 28,
          padding: '40px 28px',
          boxShadow:
            '0 1px 0 rgba(11,61,145,.06), 0 24px 60px -28px rgba(11,61,145,.3)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 88,
            height: 88,
            margin: '0 auto 24px',
            borderRadius: 24,
            background: '#06245A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFC72C',
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 900,
            fontSize: 42,
            letterSpacing: '-0.02em',
          }}
        >
          N
        </div>

        {/* English */}
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(6,36,90,0.55)', marginBottom: 6 }}>EN</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>
          Brief maintenance
        </h1>
        <p style={{ color: 'rgba(6,36,90,0.78)', lineHeight: 1.55, marginBottom: 18 }}>
          We're making a small update to the site. It will be back online shortly. For bookings or questions in the meantime, please call or message us directly — we're available 24/7.
        </p>

        <div style={{ height: 1, background: 'rgba(6,36,90,0.1)', margin: '28px 0' }} />

        {/* Greek */}
        <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(6,36,90,0.55)', marginBottom: 6 }}>ΕΛ</div>
        <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 900, fontSize: 28, lineHeight: 1.15, marginBottom: 12 }}>
          Σύντομη συντήρηση
        </h1>
        <p style={{ color: 'rgba(6,36,90,0.78)', lineHeight: 1.55, marginBottom: 18 }}>
          Κάνουμε μια μικρή ενημέρωση στον ιστότοπο. Θα είμαστε online σε λίγο. Για κρατήσεις ή ερωτήσεις, καλέστε ή στείλτε μήνυμα — διαθέσιμοι 24/7.
        </p>

        <div style={{ height: 1, background: 'rgba(6,36,90,0.1)', margin: '28px 0' }} />

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <a
            href={`tel:${phone1Tel}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px',
              background: '#06245A',
              color: '#FFC72C',
              textDecoration: 'none',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            📞 {SITE.phone}
          </a>
          <a
            href={`tel:${phone2Tel}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px',
              background: 'white',
              color: '#06245A',
              textDecoration: 'none',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 15,
              border: '1.5px solid #06245A',
            }}
          >
            📞 {SITE.phoneAlt}
          </a>
          <a
            href={`https://wa.me/${wa1}?text=${encodeURIComponent('Hello, I would like to book a taxi.')}`}
            target="_blank"
            rel="noopener"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 22px',
              background: '#25D366',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: 15,
            }}
          >
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
