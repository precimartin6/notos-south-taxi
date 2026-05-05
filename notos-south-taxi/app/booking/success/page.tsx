import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export default function BookingSuccessRedirect({
  searchParams
}: {
  searchParams: Record<string, string>;
}) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(`/en/booking/success${qs ? `?${qs}` : ''}`);
}
