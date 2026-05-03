# Notos South Taxi

Production-ready bilingual (EN/GR) taxi & transfers booking site for Athens, with Viva Wallet 15% deposit, fixed-price major routes + Google Maps custom pricing, SendZen WhatsApp notifications, and full GDPR legal pages.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **next-intl** for EN/GR i18n with toggle
- **Zod** for booking validation
- **Viva Wallet Smart Checkout** (15% deposit)
- **SendZen** WhatsApp API for driver notifications
- **Geoapify** address autocomplete (free tier, 3k req/day)
- **Google Maps Distance Matrix** for custom routes (optional)

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in keys
npm run dev
```

Open `http://localhost:3000` (auto-redirects to `/en` or `/el`).

## Environment variables (`.env.local`)

```env
# Site
NEXT_PUBLIC_SITE_URL=https://notosouthtaxi.gr

# Driver / client (the taxi driver who receives WhatsApp)
DRIVER_WHATSAPP_NUMBER=+30XXXXXXXXXX
DRIVER_EMAIL=client@example.com

# Viva Wallet (https://developer.vivawallet.com)
# Use demo.vivapayments.com for sandbox, www.vivapayments.com for production
VIVA_BASE_URL=https://demo.vivapayments.com
VIVA_ACCOUNTS_URL=https://demo-accounts.vivapayments.com
VIVA_CLIENT_ID=
VIVA_CLIENT_SECRET=
VIVA_SOURCE_CODE=
VIVA_MERCHANT_ID=
VIVA_API_KEY=
VIVA_WEBHOOK_VERIFICATION_KEY=

# SendZen WhatsApp (https://www.sendzen.io/docs)
SENDZEN_API_KEY=
SENDZEN_FROM_PHONE_ID=        # the WABA phone ID connected to your SendZen account
SENDZEN_TEMPLATE_NAME=        # optional: pre-approved template, e.g. "booking_received"
SENDZEN_TEMPLATE_LANG=en      # template language code

# Google Maps (for custom destination quotes)
GOOGLE_MAPS_API_KEY=

# Admin (simple HTTP-basic for /admin route)
ADMIN_USER=admin
ADMIN_PASS=change-me

# Database — use any. Vercel Postgres / Supabase / Neon all work.
DATABASE_URL=
```

## Deploy (Vercel — recommended)

1. Push this repo to GitHub
2. Import on https://vercel.com/new
3. Add the env vars above
4. In Viva Wallet dashboard set webhook URL to `https://your-domain/api/viva-webhook`
5. In SendZen dashboard set webhook URL to `https://your-domain/api/sendzen-webhook` (optional, for delivery receipts)

## How the booking + payment flow works

1. User fills booking form → POST `/api/quote` returns price (fixed table or Google Maps)
2. User confirms → POST `/api/booking` creates pending booking, returns Viva `orderCode`
3. User redirected to Viva Smart Checkout for **15% deposit**
4. On success Viva redirects to `/booking/success?t={orderCode}` AND fires webhook to `/api/viva-webhook`
5. Webhook verifies signature, marks booking paid, calls SendZen → driver gets WhatsApp with all booking details
6. Customer gets confirmation email (optional)

## Pricing

Fixed prices live in `lib/pricing.ts` → `FIXED_ROUTES`. Edit there to change rates.
Custom destinations call Google Maps Distance Matrix and use `BASE_FARE + PER_KM * km` with multipliers for vehicle type, child seat, luggage, night surcharge.

## Legal / GDPR

- `Martin Preci` is set as Data Controller (placeholder) in `messages/en.json` and `messages/el.json`. Edit when client gives final details (ΑΦΜ, address, email).
- 24h free cancellation enforced in `/api/booking/cancel`.
- After-trip data deletion is scheduled by a cron route `/api/cron/cleanup-bookings` (Vercel Cron). It deletes bookings older than 24h after their pickup time.

## What still needs the client / you

- [ ] Confirm Martin Preci's full company details for legal pages
- [ ] Get Viva Wallet merchant account approved
- [ ] Get SendZen account + WABA approved + create message template
- [ ] Provide real photos for destination pages (placeholders are unsplash query URLs)
- [ ] Add Google Business Profile + Facebook + Instagram URLs in `lib/site-config.ts`
- [ ] Buy domain & DNS to Vercel

## File structure

```
app/
  [locale]/                  → all user-facing pages (EN + GR)
    page.tsx                 → home
    booking/page.tsx         → booking form
    booking/success/page.tsx → confirmation
    destinations/[slug]/     → destination detail pages
    legal/[slug]/            → terms, privacy, cancellation
  api/
    quote/route.ts           → returns price for a route
    booking/route.ts         → creates booking + Viva order
    viva-webhook/route.ts    → receives Viva payment events
    cron/cleanup-bookings/   → GDPR auto-deletion
components/                  → React UI components
lib/
  pricing.ts                 → fixed-price table + custom calc
  integrations/
    viva.ts                  → Viva Wallet client
    sendzen.ts               → SendZen WhatsApp client
    maps.ts                  → Google Maps Distance Matrix
  db.ts                      → DB adapter (swap to your provider)
messages/
  en.json, el.json           → all translatable strings
```
