import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { raidAPI } from '../api';
import './Raids.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Map click handler component for pinpointing locations
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Raids() {
  const [raids, setRaids] = useState([]);
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [inputLat, setInputLat] = useState('');
  const [inputLng, setInputLng] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [isMapClickMode, setIsMapClickMode] = useState(false);
  const [mapClickMessage, setMapClickMessage] = useState('');

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
        },
        (error) => {
          console.error('Error getting user location:', error.message);
          setError('Could not access your location. Using default location.');
        }
      );
    }
  }, []);

  // Fetch nearby raids
  useEffect(() => {
    const fetchNearbyRaids = async () => {
      try {
        setLoading(true);
        const response = await raidAPI.getNearby(userLocation[0], userLocation[1], searchRadius);
        setRaids(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Raid data:', err);
        setError('Failed to load Raid data. Make sure the backend is running.');
        setRaids([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyRaids();
  }, [userLocation, searchRadius]);

  const handleManualSearch = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (isNaN(lat) || isNaN(lng)) {
      setError('Please enter valid numbers for latitude and longitude');
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

    setUserLocation([lat, lng]);
    setInputLat('');
    setInputLng('');
    setError(null);
  };

  // Geocode address to coordinates using Nominatim API
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
      setUserLocation([parseFloat(lat), parseFloat(lon)]);
      setInputLat(lat);
      setInputLng(lon);
      setAddressInput('');
      setError(null);
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError('Failed to search address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle map click to pinpoint location
  const handleMapClick = (lat, lng) => {
    setUserLocation([lat, lng]);
    setInputLat(lat.toFixed(4));
    setInputLng(lng.toFixed(4));
    setIsMapClickMode(false);
    setMapClickMessage('');
  };

  const getRaidColor = (level) => {
    const colors = {
      1: '#95a5a6',
      2: '#3498db',
      3: '#f39c12',
      4: '#e74c3c',
      5: '#9b59b6',
    };
    return colors[level] || '#95a5a6';
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = Math.floor((end - now) / 1000); // seconds

    if (diff < 0) return 'Ended';
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h`;
  };

  return (
    <div className="raids-page">
      <div className="raid-controls">
        <h2>⚔️ Raid Battles</h2>
        
        {/* Address Search */}
        <div className="location-search">
          <h3>📍 Search by Address</h3>
          <div className="search-row">
            <input
              type="text"
              placeholder="Enter address (e.g., Pittsburgh, PA or Times Square, NYC)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
            />
            <button onClick={handleAddressSearch} className="search-btn">
              🔍 Search
            </button>
          </div>
        </div>

        {/* Map Click Mode */}
        <div className="location-search">
          <button 
            onClick={() => {
              setIsMapClickMode(!isMapClickMode);
              setMapClickMessage(isMapClickMode ? '' : '📍 Click on the map to pinpoint location');
            }}
            className={`map-click-btn ${isMapClickMode ? 'active' : ''}`}
          >
            {isMapClickMode ? '✓ Map Click Mode (Active)' : '📍 Click on Map to Pinpoint'}
          </button>
          {mapClickMessage && <p className="map-click-message">{mapClickMessage}</p>}
        </div>

        {/* Manual Location Search */}
        <div className="location-search">
          <h3>🔍 Or Enter Coordinates</h3>
          <p className="search-tip">Example: Pittsburgh (40.4406, -79.9959)</p>
          <div className="search-row">
            <input
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              placeholder="Latitude"
              value={inputLat}
              onChange={(e) => setInputLat(e.target.value)}
            />
            <input
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              placeholder="Longitude"
              value={inputLng}
              onChange={(e) => setInputLng(e.target.value)}
            />
            <button onClick={handleManualSearch} className="search-btn">🔍 Search</button>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="radius">Search Radius (km):</label>
          <input
            id="radius"
            type="number"
            min="1"
            max="20"
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
          />
        </div>
        <div className="status-info">
          <p>📍 Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
          <p>🎯 Found: {raids.length} Raids nearby</p>
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>

      <MapContainer center={userLocation} zoom={13} style={{ height: 'calc(100% - 200px)', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {/* Map Click Handler */}
        {isMapClickMode && <MapClickHandler onMapClick={handleMapClick} />}

        {/* User Location Marker */}
        <Marker position={userLocation}>
          <Popup>
            <div className="popup">
              <h3>Your Location</h3>
              <p>Latitude: {userLocation[0].toFixed(6)}</p>
              <p>Longitude: {userLocation[1].toFixed(6)}</p>
            </div>
          </Popup>
        </Marker>

        {/* Search Radius Circle */}
        <Circle center={userLocation} radius={searchRadius * 1000} />

        {/* Raid Markers */}
        {raids.map((raid) => (
          <Marker
            key={raid._id}
            position={[raid.latitude, raid.longitude]}
            title={raid.gymName}
          >
            <Popup>
              <div className="popup">
                <h3>🏋️ {raid.gymName}</h3>
                <p>
                  <strong>Boss:</strong> {raid.bossName}
                </p>
                <p>
                  <strong>Level:</strong>
                  <span
                    className="raid-level"
                    style={{ backgroundColor: getRaidColor(raid.raidLevel) }}
                  >
                    {raid.raidLevel}⭐
                  </span>
                </p>
                <p>
                  <strong>Time Remaining:</strong> <span className="time-remaining">{getTimeRemaining(raid.endTime)}</span>
                </p>
                <p>
                  <strong>Participants:</strong> {raid.participants}
                </p>
                <p>
                  <strong>Starts:</strong> {new Date(raid.startTime).toLocaleTimeString()}
                </p>
                <p>
                  <strong>Ends:</strong> {new Date(raid.endTime).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Raids;
