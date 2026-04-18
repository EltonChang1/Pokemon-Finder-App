/**
 * Geocoding: prefers the backend `/api/geocode` proxy (proper User-Agent, throttling).
 * Falls back to Nominatim in the browser if the proxy is unreachable (e.g. UI without server).
 */

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const API_PREFIX = process.env.REACT_APP_API_URL || '';

async function geocodeViaProxy(rawQuery, limit, signal) {
  const params = new URLSearchParams({ q: rawQuery, limit: String(limit) });
  const headers = { Accept: 'application/json' };
  if (typeof navigator !== 'undefined' && navigator.language) {
    headers['Accept-Language'] = navigator.language;
  }
  const res = await fetch(`${API_PREFIX}/api/geocode?${params}`, {
    signal,
    headers,
  });
  if (res.status === 429) {
    const err = new Error('RATE_LIMIT');
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const err = new Error('GEOCODE_PROXY_FAILED');
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    display_name: r.display_name,
  }));
}

async function geocodeDirect(rawQuery, limit, signal) {
  const q = encodeURIComponent(rawQuery.trim());
  if (!q) return [];
  const headers = { Accept: 'application/json' };
  if (typeof navigator !== 'undefined' && navigator.language) {
    headers['Accept-Language'] = navigator.language;
  }
  const res = await fetch(`${NOMINATIM}?q=${q}&format=json&limit=${limit}`, {
    headers,
    signal,
  });
  if (!res.ok) throw new Error('Geocoding request failed');
  const results = await res.json();
  if (!Array.isArray(results)) return [];
  return results.map((r) => ({
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
    display_name: r.display_name,
  }));
}

export async function geocodeAddress(address, signal) {
  const list = await geocodeSearchResults(address, { signal, limit: 1 });
  if (!list.length) return null;
  const { lat, lon } = list[0];
  return [lat, lon];
}

/**
 * @returns {Promise<Array<{ lat: number, lon: number, display_name: string }>>}
 */
export async function geocodeSearchResults(address, { signal, limit = 5 } = {}) {
  const raw = address.trim();
  if (!raw) return [];

  try {
    return await geocodeViaProxy(raw, limit, signal);
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    if (err.message === 'RATE_LIMIT') throw err;
    try {
      return await geocodeDirect(raw, limit, signal);
    } catch (fallbackErr) {
      if (fallbackErr.name === 'AbortError') throw fallbackErr;
      throw err;
    }
  }
}

/** Parses "lat, lng" or "lat lng" with flexible whitespace */
export function parseLatLngPair(text) {
  const t = text.trim();
  const comma = t.split(',').map((s) => s.trim());
  if (comma.length >= 2) {
    const lat = parseFloat(comma[0]);
    const lng = parseFloat(comma[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  const parts = t.split(/\s+/);
  if (parts.length >= 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
  }
  return null;
}
