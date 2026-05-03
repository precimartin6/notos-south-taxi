import { NextRequest, NextResponse } from 'next/server';
import { geoapifyAutocomplete } from '@/lib/integrations/geoapify';

/**
 * GET /api/places-autocomplete?q=foo&lang=en
 * Returns up to 6 address suggestions biased to Greece.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const lang = (req.nextUrl.searchParams.get('lang') || 'en') as 'en' | 'el';
  if (q.trim().length < 3) {
    return NextResponse.json({ results: [] });
  }
  const results = await geoapifyAutocomplete(q, lang);
  return NextResponse.json({ results });
}
