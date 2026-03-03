import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
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

function Raids() {
  const [raids, setRaids] = useState([]);
  const [userLocation, setUserLocation] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);

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
