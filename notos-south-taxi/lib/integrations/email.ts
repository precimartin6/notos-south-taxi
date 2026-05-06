/**
 * Resend — customer booking confirmation email.
 *
 * Setup:
 * 1. Create a free account at https://resend.com
 * 2. Verify your sending domain (e.g. notossouthtaxi.com) or use Resend's shared domain for testing
 * 3. Generate an API key and set:
 *      RESEND_API_KEY   = re_xxxxxxxxxxxxxxxx
 *      RESEND_FROM_EMAIL = bookings@notossouthtaxi.com   (must match verified domain)
 */

import { SITE } from '@/lib/site-config';

export interface CustomerEmailPayload {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  fromText: string;
  toText: string;
  pickupAtIso: string;
  passengers: number;
  luggage: number;
  childSeats: number;
  vehicle: string;
  flightNumber?: string;
  notes?: string;
  totalEUR: number;
  depositEUR: number;
  remainderEUR: number;
  locale?: 'en' | 'el';
}

// ─── i18n strings ─────────────────────────────────────────────────────────────

const T = {
  en: {
    subject: (ref: string) => `Booking Confirmed — ${ref} | Notos South Taxi`,
    heading: 'Booking Confirmed',
    hi: (name: string) => `Dear ${name},`,
    intro: 'Your transfer has been confirmed and the driver has been notified. Here are your booking details:',
    ref: 'Booking ref',
    pickup: 'Pickup date & time',
    from: 'From',
    to: 'To',
    vehicle: 'Vehicle',
    passengers: 'Passengers',
    luggage: 'Luggage',
    childSeats: 'Child seats',
    flight: 'Flight number',
    notes: 'Notes',
    deposit: 'Booking fee paid online',
    remainder: 'Balance due in cash on arrival',
    total: 'Total',
    cancelTitle: 'Need to change or cancel?',
    cancelBody: 'Please contact us as early as possible:',
    footer: `© ${new Date().getFullYear()} Notos South Taxi — VAT ${SITE.vatId}`,
  },
  el: {
    subject: (ref: string) => `Επιβεβαίωση Κράτησης — ${ref} | Notos South Taxi`,
    heading: 'Κράτηση Επιβεβαιώθηκε',
    hi: (name: string) => `Αγαπητέ/ή ${name},`,
    intro: 'Η μεταφορά σας επιβεβαιώθηκε και ο οδηγός ειδοποιήθηκε. Παρακάτω είναι τα στοιχεία της κράτησής σας:',
    ref: 'Αριθμός κράτησης',
    pickup: 'Ημερομηνία & ώρα παραλαβής',
    from: 'Σημείο αναχώρησης',
    to: 'Προορισμός',
    vehicle: 'Όχημα',
    passengers: 'Επιβάτες',
    luggage: 'Αποσκευές',
    childSeats: 'Παιδικά καθίσματα',
    flight: 'Αριθμός πτήσης',
    notes: 'Σημειώσεις',
    deposit: 'Προκαταβολή online',
    remainder: 'Υπόλοιπο σε μετρητά κατά την παραλαβή',
    total: 'Σύνολο',
    cancelTitle: 'Χρειάζεστε αλλαγή ή ακύρωση;',
    cancelBody: 'Επικοινωνήστε μαζί μας το συντομότερο δυνατόν:',
    footer: `© ${new Date().getFullYear()} Notos South Taxi — ΑΦΜ ${SITE.vatId}`,
  },
};

const VEHICLE_LABELS: Record<string, { en: string; el: string }> = {
  taxi:          { en: 'Standard Taxi',   el: 'Ταξί' },
  station_wagon: { en: 'Station Wagon',   el: 'Station Wagon' },
  van:           { en: 'Van (up to 8)',   el: 'Van (έως 8 άτομα)' },
  coach:         { en: 'Minibus / Coach', el: 'Πούλμαν' },
};

// ─── HTML template ────────────────────────────────────────────────────────────

function row(label: string, value: string | number, shade: boolean): string {
  const bg = shade ? '#f4f4f4' : '#ffffff';
  return `<tr>
    <td style="padding:10px 14px;background:${bg};color:#555;font-size:14px;width:42%;vertical-align:top;">${label}</td>
    <td style="padding:10px 14px;background:${bg};color:#111;font-size:14px;font-weight:600;">${value}</td>
  </tr>`;
}

function buildHtml(b: CustomerEmailPayload): string {
  const locale = b.locale ?? 'en';
  const t = T[locale];
  const vLabel = VEHICLE_LABELS[b.vehicle]?.[locale] ?? b.vehicle;

  const dt = new Date(b.pickupAtIso);
  const dateStr = dt.toLocaleString(locale === 'el' ? 'el-GR' : 'en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Athens',
  });

  const rows = [
    row(t.ref,        b.bookingRef, false),
    row(t.pickup,     dateStr,      true),
    row(t.from,       b.fromText,   false),
    row(t.to,         b.toText,     true),
    row(t.vehicle,    vLabel,       false),
    row(t.passengers, b.passengers, true),
    row(t.luggage,    b.luggage,    false),
    ...(b.childSeats > 0 ? [row(t.childSeats, b.childSeats, true)] : []),
    ...(b.flightNumber ? [row(t.flight, b.flightNumber, false)] : []),
    ...(b.notes ? [row(t.notes, b.notes, true)] : []),
    row(t.deposit,    `€${b.depositEUR.toFixed(2)}`, false),
    row(t.remainder,  `€${b.remainderEUR.toFixed(2)}`, true),
    row(t.total,      `€${b.totalEUR.toFixed(2)}`, false),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- header -->
        <tr>
          <td style="background:#0f172a;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#f8d347;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Notos South Taxi</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">✓ ${t.heading}</h1>
          </td>
        </tr>

        <!-- intro -->
        <tr>
          <td style="padding:28px 32px 20px;">
            <p style="margin:0 0 8px;font-size:15px;color:#333;">${t.hi(b.customerName)}</p>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.6;">${t.intro}</p>
          </td>
        </tr>

        <!-- booking table -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;border:1px solid #e5e5e5;">
              ${rows}
            </table>
          </td>
        </tr>

        <!-- cancellation / contact -->
        <tr>
          <td style="padding:0 32px 28px;">
            <div style="background:#fef9ec;border:1px solid #f8d347;border-radius:6px;padding:16px 20px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#333;">${t.cancelTitle}</p>
              <p style="margin:0 0 8px;font-size:14px;color:#555;">${t.cancelBody}</p>
              <p style="margin:0;font-size:14px;color:#333;">
                📞 <a href="tel:${SITE.phone.replace(/\s/g,'')}" style="color:#0f172a;">${SITE.phone}</a>&nbsp;&nbsp;
                ✉️ <a href="mailto:${SITE.email}" style="color:#0f172a;">${SITE.email}</a>
              </p>
            </div>
          </td>
        </tr>

        <!-- footer -->
        <tr>
          <td style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="margin:0;font-size:12px;color:#999;">${t.footer}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendCustomerConfirmation(b: CustomerEmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL ?? 'bookings@notossouthtaxi.com';

  if (!apiKey) {
    console.warn('[resend] RESEND_API_KEY not set — skipping customer confirmation email');
    return;
  }

  const locale = b.locale ?? 'en';
  const t = T[locale];

  try {
    const { Resend } = require('resend') as typeof import('resend');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to:      b.customerEmail,
      subject: t.subject(b.bookingRef),
      html:    buildHtml(b),
    });

    if (error) {
      console.error('[resend] Failed to send confirmation:', error);
    } else {
      console.log(`[resend] Confirmation sent to ${b.customerEmail} for ${b.bookingRef} ✓`);
    }
  } catch (err) {
    console.error('[resend] Request error:', err);
  }
}

// ─── Driver notification email ────────────────────────────────────────────────

function buildDriverHtml(b: CustomerEmailPayload): string {
  const dt = new Date(b.pickupAtIso);
  const dateStr = dt.toLocaleString('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Europe/Athens',
  });

  const VEHICLE_LABELS: Record<string, string> = {
    taxi: 'Standard Taxi', station_wagon: 'Station Wagon', van: 'Van (up to 8)', coach: 'Minibus / Coach',
  };

  const rows = [
    row('Booking ref',       b.bookingRef,                          false),
    row('Pickup',            dateStr,                               true),
    row('From',              b.fromText,                            false),
    row('To',                b.toText,                              true),
    row('Vehicle',           VEHICLE_LABELS[b.vehicle] ?? b.vehicle, false),
    row('Passengers',        b.passengers,                          true),
    row('Luggage',           b.luggage,                             false),
    ...(b.childSeats > 0    ? [row('Child seats',   b.childSeats,   true)]  : []),
    ...(b.flightNumber      ? [row('Flight',         b.flightNumber, false)] : []),
    ...(b.notes             ? [row('Notes',          b.notes,        true)]  : []),
    row('Customer',          b.customerName,                        false),
    row('Phone',             b.customerPhone ?? '',                 true),
    row('Email',             b.customerEmail,                       false),
    row('Deposit paid',      `€${b.depositEUR.toFixed(2)}`,         true),
    row('Cash on arrival',   `€${b.remainderEUR.toFixed(2)}`,       false),
    row('Total',             `€${b.totalEUR.toFixed(2)}`,           true),
  ].join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f0f0;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#1e3a5f;padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#f8d347;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Notos South Taxi — Driver</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:700;">🚖 New Booking Paid</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;border:1px solid #e5e5e5;">
              ${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:16px 32px;text-align:center;border-top:1px solid #e5e5e5;">
            <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} Notos South Taxi — ${SITE.vatId}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendDriverNotification(b: CustomerEmailPayload): Promise<void> {
  const apiKey      = process.env.RESEND_API_KEY;
  const from        = process.env.RESEND_FROM_EMAIL ?? 'bookings@notossouthtaxi.com';
  const driverEmail = process.env.DRIVER_EMAIL;

  if (!apiKey) {
    console.warn('[resend] RESEND_API_KEY not set — skipping driver notification email');
    return;
  }
  if (!driverEmail) {
    console.warn('[resend] DRIVER_EMAIL not set — skipping driver notification email');
    return;
  }

  try {
    const { Resend } = require('resend') as typeof import('resend');
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to:      driverEmail,
      subject: `🚖 New booking ${b.bookingRef} — ${b.fromText} → ${b.toText}`,
      html:    buildDriverHtml(b),
    });

    if (error) {
      console.error('[resend] Failed to send driver notification:', error);
    } else {
      console.log(`[resend] Driver notified at ${driverEmail} for ${b.bookingRef} ✓`);
    }
  } catch (err) {
    console.error('[resend] Driver email error:', err);
  }
}
