/**
 * Geoapify Autocomplete API — used to suggest addresses as the user types.
 * Docs: https://apidocs.geoapify.com/docs/geocoding/address-autocomplete/
 *
 * We proxy through our own /api/places-autocomplete so the API key stays
 * on the server. Free tier: 3,000 requests/day, no card required.
 */

const KEY = process.env.GEOAPIFY_API_KEY || '';

export interface AutocompleteResult {
  formatted: string;        // human-readable single-line address
  lat: number;
  lon: number;
  /** Geoapify's stable id for this place; opaque, store as-is */
  placeId?: string;
  city?: string;
  country?: string;
}

export async function geoapifyAutocomplete(
  text: string,
  lang: 'en' | 'el' = 'en'
): Promise<AutocompleteResult[]> {
  if (!KEY) {
    console.warn('[geoapify] GEOAPIFY_API_KEY not set');
    return [];
  }
  if (!text || text.trim().length < 3) return [];

  const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
  url.searchParams.set('text', text);
  url.searchParams.set('lang', lang);
  url.searchParams.set('limit', '6');
  // Bias to Greece — but don't filter strictly so cross-border addresses still resolve
  url.searchParams.set('filter', 'countrycode:gr');
  url.searchParams.set('bias', 'countrycode:gr');
  url.searchParams.set('apiKey', KEY);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    console.warn('[geoapify] HTTP', res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as any;
  if (!Array.isArray(data?.features)) return [];

  return data.features
    .map((f: any) => {
      const p = f.properties || {};
      const lat = f.geometry?.coordinates?.[1];
      const lon = f.geometry?.coordinates?.[0];
      if (typeof lat !== 'number' || typeof lon !== 'number') return null;
      return {
        formatted: p.formatted || `${p.address_line1 || ''}${p.address_line2 ? ', ' + p.address_line2 : ''}`,
        lat,
        lon,
        placeId: p.place_id,
        city: p.city,
        country: p.country
      } as AutocompleteResult;
    })
    .filter(Boolean) as AutocompleteResult[];
}
