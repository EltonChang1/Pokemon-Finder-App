export async function geocodeAddress(address) {
  const q = encodeURIComponent(address.trim());
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${q}&format=json`,
    { headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error('Geocoding request failed');
  const results = await res.json();
  if (!results.length) return null;
  return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
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
