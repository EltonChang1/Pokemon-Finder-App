import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pokemonAPI } from '../api';
import './Map.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function Map() {
  const [pokemonSpawns, setPokemonSpawns] = useState([]);
  const [userLocation, setUserLocation] = useState([51.505, -0.09]); // Default to London
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

  return (
    <div className="map-page">
      <div className="map-controls">
        <h2>🗺️ Pokémon Radar</h2>
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
          <p>🎯 Found: {pokemonSpawns.length} Pokémon nearby</p>
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

        {/* Pokémon Spawn Markers */}
        {pokemonSpawns.map((pokemon) => (
          <Marker
            key={pokemon._id}
            position={[pokemon.latitude, pokemon.longitude]}
            title={pokemon.name}
          >
            <Popup>
              <div className="popup">
                <h3>{pokemon.name}</h3>
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
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
