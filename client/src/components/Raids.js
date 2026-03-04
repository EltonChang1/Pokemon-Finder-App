import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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

function RecenterMap({ center, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function Raids({ userLocation }) {
  const [raids, setRaids] = useState([]);
  const [filteredRaids, setFilteredRaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  
  // Filter states
  const [bossSearch, setBossSearch] = useState('');
  const [selectedLevels, setSelectedLevels] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });
  const [minParticipants, setMinParticipants] = useState(0);
  const [minTimeRemaining, setMinTimeRemaining] = useState(0); // in seconds
  const [showFilters, setShowFilters] = useState(false);

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

  // Apply filters
  useEffect(() => {
    const filtered = raids.filter(raid => {
      // Boss name filter
      if (bossSearch && !raid.bossName.toLowerCase().includes(bossSearch.toLowerCase())) {
        return false;
      }
      
      // Raid level filter
      if (!selectedLevels[raid.raidLevel]) {
        return false;
      }
      
      // Participants filter
      if (raid.participants < minParticipants) {
        return false;
      }
      
      // Time remaining filter
      const now = new Date();
      const endTime = new Date(raid.endTime);
      const timeRemaining = Math.floor((endTime - now) / 1000);
      
      if (timeRemaining < minTimeRemaining) {
        return false;
      }
      
      return true;
    });
    
    setFilteredRaids(filtered);
  }, [raids, bossSearch, selectedLevels, minParticipants, minTimeRemaining]);

  const handleLevelToggle = (level) => {
    setSelectedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }));
  };

  const resetFilters = () => {
    setBossSearch('');
    setSelectedLevels({
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
    });
    setMinParticipants(0);
    setMinTimeRemaining(0);
  };

  const getTimeRemaining = (endTime) => {
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
        <div className="control-group">
          <label htmlFor="radius">🎯 Search Radius (km):</label>
          <input
            id="radius"
            type="number"
            min="1"
            max="20"
            value={searchRadius}
            onChange={(e) => setSearchRadius(Number(e.target.value))}
          />
        </div>

        <button 
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: showFilters ? '#e74c3c' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            marginTop: '10px'
          }}
        >
          {showFilters ? '✕ Hide Filters' : '⚙️ Show Filters'}
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{
            marginTop: '15px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '2px solid #3498db'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🔍 Advanced Raid Filters</h3>
            
            {/* Boss Search */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                🐉 Search Boss Name:
              </label>
              <input
                type="text"
                placeholder="e.g., Articuno, Moltres..."
                value={bossSearch}
                onChange={(e) => setBossSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #bdc3c7',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Raid Level Filter */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                ⭐ Raid Level:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedLevels[level]}
                      onChange={() => handleLevelToggle(level)}
                    />
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getRaidColor(level),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      Level {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Participants */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                👥 Minimum Participants: {minParticipants}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={minParticipants}
                onChange={(e) => setMinParticipants(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Minimum Time Remaining */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                ⏱️ Minimum Time Remaining: {minTimeRemaining > 0 ? `${Math.floor(minTimeRemaining / 60)}m` : 'Any'}
              </label>
              <input
                type="range"
                min="0"
                max="3600"
                step="60"
                value={minTimeRemaining}
                onChange={(e) => setMinTimeRemaining(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <button
              onClick={resetFilters}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ↺ Reset Filters
            </button>
          </div>
        )}

        <div className="status-info">
          <p>📍 Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
          <p>🎯 Total Found: {raids.length} | Showing: {filteredRaids.length} Raids</p>
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>

      <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
        <RecenterMap center={userLocation} zoom={13} />
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
        {filteredRaids.map((raid) => (
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
