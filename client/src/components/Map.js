import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pokemonAPI } from '../api';
import './Map.css';

// Helper: Create custom Pokémon icon from sprite URL
const createPokemonIcon = (pokedexId, rarity) => {
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
  const rarityColors = {
    'Common': '#95a5a6',
    'Uncommon': '#3498db',
    'Rare': '#f39c12',
    'Very Rare': '#e74c3c',
    'Legendary': '#9b59b6',
  };
  
  return L.divIcon({
    html: `
      <div style="
        background: white;
        border: 3px solid ${rarityColors[rarity] || '#95a5a6'};
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <img src="${spriteUrl}" alt="Pokemon" style="width: 35px; height: 35px;" />
      </div>
    `,
    className: 'pokemon-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
};

// Fix for default markers in Leaflet (for user location)
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

function Map() {
  const [pokemonSpawns, setPokemonSpawns] = useState([]);
  const [userLocation, setUserLocation] = useState([40.4406, -79.9959]); // Default to Pittsburgh, PA
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [inputLat, setInputLat] = useState('40.4406');
  const [inputLng, setInputLng] = useState('-79.9959');
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
          console.log(`User location: ${latitude}, ${longitude}`);
        },
        (error) => {
          console.error('Error getting user location:', error.message);
          setError('Could not access your location. Using default location.');
        }
      );
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  }, []);

  // Fetch nearby Pokémon spawns
  useEffect(() => {
    const fetchNearbyPokemon = async () => {
      try {
        setLoading(true);
        const response = await pokemonAPI.getNearby(userLocation[0], userLocation[1], searchRadius);
        setPokemonSpawns(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching Pokémon data:', err);
        setError('Failed to load Pokémon data. Make sure the backend is running.');
        setPokemonSpawns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyPokemon();
  }, [userLocation, searchRadius]);

  const getRarityColor = (rarity) => {
    const colors = {
      'Common': '#95a5a6',
      'Uncommon': '#3498db',
      'Rare': '#f39c12',
      'Very Rare': '#e74c3c',
      'Legendary': '#9b59b6',
    };
    return colors[rarity] || '#95a5a6';
  };

  // Handle manual location search
  const handleManualSearch = () => {
    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
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

    setUserLocation([lat, lng]);
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

  return (
    <div className="map-page">
      <div className="map-controls">
        <h2>🗺️ Pokémon Radar</h2>
        
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

        {/* Manual Coordinates Entry */}
        <div className="location-search">
          <h3>📍 Or Enter Coordinates</h3>
          <div className="search-row">
            <div className="input-group">
              <label htmlFor="latitude">Latitude:</label>
              <input
                id="latitude"
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={inputLat}
                onChange={(e) => setInputLat(e.target.value)}
                placeholder="e.g., 40.4406"
              />
            </div>
            <div className="input-group">
              <label htmlFor="longitude">Longitude:</label>
              <input
                id="longitude"
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={inputLng}
                onChange={(e) => setInputLng(e.target.value)}
                placeholder="e.g., -79.9959"
              />
            </div>
            <button 
              onClick={handleManualSearch}
              style={{
                padding: '8px 16px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔍 Search
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#7f8c8d', margin: '5px 0 0 0' }}>
            💡 Tip: Try Pittsburgh (40.4406, -79.9959) or enter any lat/lng
          </p>
        </div>

        {/* Search Radius */}
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

        {/* Status Info */}
        <div className="status-info">
          <p>📍 Current Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
          <p>🎯 Found: {pokemonSpawns.length} Pokémon nearby</p>
          {loading && <p className="loading">Loading...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      </div>

      <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }}>
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

        {/* Pokémon Spawn Markers */}
        {pokemonSpawns.map((pokemon) => (
          <Marker
            key={pokemon._id}
            position={[pokemon.latitude, pokemon.longitude]}
            icon={createPokemonIcon(pokemon.pokedexId, pokemon.rarity)}
          >
            <Popup>
              <div className="popup pokemon-popup">
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokedexId}.png`}
                    alt={pokemon.name}
                    style={{ width: '80px', height: '80px' }}
                  />
                  <h3>#{pokemon.pokedexId} {pokemon.name}</h3>
                </div>
                <p>
                  <strong>Rarity:</strong>
                  <span
                    className="rarity-badge"
                    style={{ backgroundColor: getRarityColor(pokemon.rarity) }}
                  >
                    {pokemon.rarity}
                  </span>
                </p>
                <p>
                  <strong>IV Stats:</strong>
                  <br />
                  ATK: {pokemon.iv_attack || 0} | DEF: {pokemon.iv_defense || 0} | STA: {pokemon.iv_stamina || 0}
                  <br />
                  <strong style={{ color: pokemon.iv_attack + pokemon.iv_defense + pokemon.iv_stamina > 30 ? '#27ae60' : '#95a5a6' }}>
                    Total: {(((pokemon.iv_attack || 0) + (pokemon.iv_defense || 0) + (pokemon.iv_stamina || 0)) / 45 * 100).toFixed(1)}%
                  </strong>
                </p>
                <p>
                  <strong>Spawned:</strong> {new Date(pokemon.spawnTime).toLocaleTimeString()}
                </p>
                {pokemon.despawnTime && (
                  <p>
                    <strong>Despawns:</strong> {new Date(pokemon.despawnTime).toLocaleTimeString()}
                  </p>
                )}
                <p>
                  <strong>Accuracy:</strong> {pokemon.accuracy}%
                </p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${pokemon.latitude},${pokemon.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#4285f4',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  🗺️ Get Directions
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
