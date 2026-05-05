import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function BookingFailureRedirect({
  searchParams
}: {
  searchParams: Record<string, string>;
}) {
  const qs = new URLSearchParams(searchParams).toString();
  redirect(`/en/booking/failure${qs ? `?${qs}` : ''}`);
}
