# 🚖 Notos South Taxi

**Live site:** [notosouthtaxi.gr](https://notosouthtaxi.gr)

Licensed Athens taxi service based on the Riviera — airport transfers, private tours, and group travel across Greece.

---

## Features

- **Bilingual** — full English & Greek (el/en) with seamless language switching
- **Booking system** — real-time price quotes, vehicle selection, extras (child seats, luggage)
- **Online payments** — Viva Wallet Smart Checkout (live, PCI compliant)
- **Automated notifications** — customer confirmation email + driver WhatsApp & email on every paid booking
- **16 destinations** — fixed-price routes across Greece with photo galleries
- **Reviews carousel** — real Google reviews, auto-rotating
- **Maintenance mode** — toggle via Vercel env var, no redeploy needed
- **SEO** — sitemap, robots.txt, JSON-LD TaxiService schema, OpenGraph

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| i18n | next-intl |
| Payments | Viva Wallet Smart Checkout |
| Database | Upstash KV (Redis) |
| Email | Resend |
| WhatsApp | CallMeBot API |
| Address autocomplete | Geoapify |
| Hosting | Vercel |
| Domain | Papaki |

---

## Architecture

```
Customer fills booking form
        ↓
Quote API → FIXED_ROUTES pricing table (bidirectional lookup)
        ↓
Booking API → saves to Upstash KV → creates Viva order
        ↓
Customer pays on Viva Smart Checkout
        ↓
Viva redirects to /booking/success
        ↓
Status API → verifies transaction with Viva API
        ↓
Promise.all([
  Customer confirmation email (Resend),
  Driver notification email (Resend),
  Driver WhatsApp message (CallMeBot)
])
```

---

## Environment Variables

```env
NEXT_PUBLIC_SITE_URL=
VIVA_BASE_URL=
VIVA_ACCOUNTS_URL=
VIVA_CLIENT_ID=
VIVA_CLIENT_SECRET=
VIVA_SOURCE_CODE=
VIVA_MERCHANT_ID=
VIVA_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
DRIVER_EMAIL=
CALLMEBOT_PHONE=
CALLMEBOT_API_KEY=
GEOAPIFY_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
MAINTENANCE_MODE=false
MAINTENANCE_BYPASS_TOKEN=
```

---

## Built by

**g3r0rr** — [github.com/g3r0rr](https://github.com/g3r0rr)
