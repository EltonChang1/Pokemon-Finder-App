import React, { useEffect, useState } from 'react';
import { geocodeSearchResults } from '../utils/geocode';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import '../styles/LocationSearchModal.css';

function LocationSearchModal({ isOpen, onClose, onLocationChange, currentLocation }) {
  const [addressInput, setAddressInput] = useState('');
  const [inputLat, setInputLat] = useState(currentLocation?.[0]?.toFixed(4) || '40.4406');
  const [inputLng, setInputLng] = useState(currentLocation?.[1]?.toFixed(4) || '-79.9959');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const debouncedAddress = useDebouncedValue(addressInput, 700);

  useEffect(() => {
    if (isOpen && currentLocation?.length === 2) {
      setInputLat(currentLocation[0].toFixed(4));
      setInputLng(currentLocation[1].toFixed(4));
      setError(null);
    }
  }, [isOpen, currentLocation]);

  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
      return;
    }
    const q = debouncedAddress.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    const ac = new AbortController();
    setSuggestLoading(true);
    geocodeSearchResults(q, { signal: ac.signal, limit: 5 })
      .then((rows) => {
        if (!ac.signal.aborted) setSuggestions(rows);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (!ac.signal.aborted) setSuggestions([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setSuggestLoading(false);
      });

    return () => ac.abort();
  }, [debouncedAddress, isOpen]);

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      setLoading(true);
      const rows = await geocodeSearchResults(addressInput.trim(), { limit: 1 });
      if (!rows.length) {
        setError(`No location found for "${addressInput}". Try a different address.`);
        return;
      }
      const { lat, lon } = rows[0];
      onLocationChange([lat, lon]);
      setAddressInput('');
      setSuggestions([]);
      setError(null);
      onClose();
    } catch (err) {
      console.error('Error geocoding address:', err);
      if (err.message === 'RATE_LIMIT') {
        setError('Too many searches. Wait a second and try again.');
      } else {
        setError('Failed to search address. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const pickSuggestion = (row) => {
    onLocationChange([row.lat, row.lon]);
    setAddressInput('');
    setSuggestions([]);
    setError(null);
    onClose();
  };

  const handleCoordinatesSearch = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid latitude and longitude values');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    onLocationChange([lat, lng]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📍 Search Location</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="modal-section">
          <h3>Search by Address</h3>
          <p className="coords-tip" style={{ marginBottom: '10px' }}>
            Suggestions refresh after you pause typing (~0.7s). Respect Nominatim rate limits in production.
          </p>
          <div className="address-search-row">
            <input
              type="text"
              placeholder="Enter address (e.g., Pittsburgh, PA or Times Square, NYC)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
              disabled={loading}
            />
            <button type="button" onClick={handleAddressSearch} disabled={loading} className="modal-btn">
              {loading ? '🔄' : '🔍'} Search
            </button>
          </div>
          {suggestLoading && <p className="coords-tip">Looking up addresses…</p>}
          {!suggestLoading && suggestions.length > 0 && (
            <ul className="hq-suggest-list">
              {suggestions.map((s, i) => (
                <li key={`${s.lat},${s.lon},${i}`}>
                  <button type="button" className="hq-suggest-item" onClick={() => pickSuggestion(s)}>
                    {s.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-section">
          <h3>Or Enter Coordinates</h3>
          <div className="coords-search-row">
            <div className="coord-input">
              <label>Latitude</label>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                placeholder="40.4406"
              />
            </div>
            <div className="coord-input">
              <label>Longitude</label>
              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                placeholder="-79.9959"
              />
            </div>
            <button type="button" onClick={handleCoordinatesSearch} className="modal-btn coord-btn">
              🔍 Search
            </button>
          </div>
          <p className="coords-tip">💡 Example: Pittsburgh (40.4406, -79.9959)</p>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="modal-btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationSearchModal;
