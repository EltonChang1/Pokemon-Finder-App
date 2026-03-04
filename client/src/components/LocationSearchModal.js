import React, { useState } from 'react';
import '../styles/LocationSearchModal.css';

function LocationSearchModal({ isOpen, onClose, onLocationChange, currentLocation }) {
  const [addressInput, setAddressInput] = useState('');
  const [inputLat, setInputLat] = useState(currentLocation?.[0]?.toFixed(4) || '40.4406');
  const [inputLng, setInputLng] = useState(currentLocation?.[1]?.toFixed(4) || '-79.9959');
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [mapClickMessage, setMapClickMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddressSearch = async () => {
    if (!addressInput.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressInput)}&format=json`
      );
      const results = await response.json();

      if (results.length === 0) {
        setError(`No location found for "${addressInput}". Try a different address.`);
        return;
      }

      const { lat, lon } = results[0];
      onLocationChange([parseFloat(lat), parseFloat(lon)]);
      setAddressInput('');
      setError(null);
      onClose();
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError('Failed to search address. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        {/* Address Search */}
        <div className="modal-section">
          <h3>Search by Address</h3>
          <div className="address-search-row">
            <input
              type="text"
              placeholder="Enter address (e.g., Pittsburgh, PA or Times Square, NYC)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
              disabled={loading}
            />
            <button onClick={handleAddressSearch} disabled={loading} className="modal-btn">
              {loading ? '🔄' : '🔍'} Search
            </button>
          </div>
        </div>

        {/* Coordinates Search */}
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
            <button onClick={handleCoordinatesSearch} className="modal-btn coord-btn">
              🔍 Search
            </button>
          </div>
          <p className="coords-tip">💡 Example: Pittsburgh (40.4406, -79.9959)</p>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="modal-btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}

export default LocationSearchModal;
