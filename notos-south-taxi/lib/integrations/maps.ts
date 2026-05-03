/**
 * Google Maps Distance Matrix — used for custom destinations (when the
 * route is not in our fixed-price table).
 * Docs: https://developers.google.com/maps/documentation/distance-matrix
 */

const KEY = process.env.GOOGLE_MAPS_API_KEY || '';

export async function distanceKm(origin: string, destination: string): Promise<number | null> {
  if (!KEY) {
    console.warn('[maps] GOOGLE_MAPS_API_KEY not set');
    return null;
  }
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', origin);
  url.searchParams.set('destinations', destination);
  url.searchParams.set('region', 'gr');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('key', KEY);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const meters = data?.rows?.[0]?.elements?.[0]?.distance?.value;
  if (!meters) return null;
  return meters / 1000;
}
