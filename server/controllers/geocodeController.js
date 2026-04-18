const axios = require('axios');

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const UA =
  process.env.NOMINATIM_USER_AGENT ||
  'PokeFindHQ/1.2 (https://github.com/EltonChang1/Pokemon-Finder-App; geocode proxy)';

/** @type {Map<string, number>} */
const lastRequestMsByIp = new Map();

function throttleGeocode(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const prev = lastRequestMsByIp.get(ip) || 0;
  if (now - prev < 1100) {
    return res.status(429).json({ message: 'Geocode rate limited. Wait about one second between searches.' });
  }
  lastRequestMsByIp.set(ip, now);
  next();
}

exports.search = [throttleGeocode, async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limitRaw = parseInt(String(req.query.limit || '5'), 10);
  const limit = Number.isNaN(limitRaw) ? 5 : Math.min(10, Math.max(1, limitRaw));

  if (q.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters' });
  }
  if (q.length > 256) {
    return res.status(400).json({ message: 'Query too long' });
  }

  try {
    const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&limit=${limit}`;
    const acceptLang = req.get('accept-language');
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'application/json',
        ...(acceptLang ? { 'Accept-Language': acceptLang.split(',')[0].trim() } : {}),
      },
      timeout: 12000,
      validateStatus: (s) => s < 500,
    });

    if (!Array.isArray(data)) {
      return res.status(502).json({ message: 'Unexpected upstream response' });
    }

    const mapped = data.map((r) => ({
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      display_name: r.display_name,
    }));

    return res.json(mapped);
  } catch (err) {
    console.error('Geocode proxy error:', err.message);
    return res.status(502).json({ message: 'Geocoding service unavailable' });
  }
}];
