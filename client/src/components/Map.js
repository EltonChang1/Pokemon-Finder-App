import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
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

function RecenterMap({ center, zoom = 13 }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

function Map({ userLocation }) {
  const [pokemonSpawns, setPokemonSpawns] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  
  // Filter states
  const [nameSearch, setNameSearch] = useState('');
  const [selectedRarities, setSelectedRarities] = useState({
    'Common': true,
    'Uncommon': true,
    'Rare': true,
    'Very Rare': true,
    'Legendary': true,
  });
  const [ivAttackMin, setIvAttackMin] = useState(0);
  const [ivAttackMax, setIvAttackMax] = useState(15);
  const [ivDefenseMin, setIvDefenseMin] = useState(0);
  const [ivDefenseMax, setIvDefenseMax] = useState(15);
  const [ivStaminaMin, setIvStaminaMin] = useState(0);
  const [ivStaminaMax, setIvStaminaMax] = useState(15);
  const [accuracyMin, setAccuracyMin] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

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

  // Apply filters whenever filters change or pokemonSpawns updates
  useEffect(() => {
    const filtered = pokemonSpawns.filter(pokemon => {
      // Name filter
      if (nameSearch && !pokemon.name.toLowerCase().includes(nameSearch.toLowerCase())) {
        return false;
      }
      
      // Rarity filter
      if (!selectedRarities[pokemon.rarity]) {
        return false;
      }
      
      // IV Attack filter
      if ((pokemon.iv_attack || 0) < ivAttackMin || (pokemon.iv_attack || 0) > ivAttackMax) {
        return false;
      }
      
      // IV Defense filter
      if ((pokemon.iv_defense || 0) < ivDefenseMin || (pokemon.iv_defense || 0) > ivDefenseMax) {
        return false;
      }
      
      // IV Stamina filter
      if ((pokemon.iv_stamina || 0) < ivStaminaMin || (pokemon.iv_stamina || 0) > ivStaminaMax) {
        return false;
      }
      
      // Accuracy filter
      if ((pokemon.accuracy || 100) < accuracyMin) {
        return false;
      }
      
      return true;
    });
    
    setFilteredPokemon(filtered);
  }, [pokemonSpawns, nameSearch, selectedRarities, ivAttackMin, ivAttackMax, ivDefenseMin, ivDefenseMax, ivStaminaMin, ivStaminaMax, accuracyMin]);

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

  const handleRarityToggle = (rarity) => {
    setSelectedRarities(prev => ({
      ...prev,
      [rarity]: !prev[rarity]
    }));
  };

  const resetFilters = () => {
    setNameSearch('');
    setSelectedRarities({
      'Common': true,
      'Uncommon': true,
      'Rare': true,
      'Very Rare': true,
      'Legendary': true,
    });
    setIvAttackMin(0);
    setIvAttackMax(15);
    setIvDefenseMin(0);
    setIvDefenseMax(15);
    setIvStaminaMin(0);
    setIvStaminaMax(15);
    setAccuracyMin(0);
  };

  return (
    <div className="map-page">
      <div className="map-controls">
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
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>🔍 Advanced Filters</h3>
            
            {/* Name Search */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                🔎 Search Pokémon Name:
              </label>
              <input
                type="text"
                placeholder="e.g., Pikachu, Charizard..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
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

            {/* Rarity Filter */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                ✨ Rarity:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.keys(selectedRarities).map(rarity => (
                  <label key={rarity} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedRarities[rarity]}
                      onChange={() => handleRarityToggle(rarity)}
                    />
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: getRarityColor(rarity),
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {rarity}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* IV Stats Filters */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                💪 IV Attack: {ivAttackMin} - {ivAttackMax}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivAttackMin}
                  onChange={(e) => setIvAttackMin(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivAttackMax}
                  onChange={(e) => setIvAttackMax(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                🛡️ IV Defense: {ivDefenseMin} - {ivDefenseMax}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivDefenseMin}
                  onChange={(e) => setIvDefenseMin(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivDefenseMax}
                  onChange={(e) => setIvDefenseMax(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                ❤️ IV Stamina: {ivStaminaMin} - {ivStaminaMax}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivStaminaMin}
                  onChange={(e) => setIvStaminaMin(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
                <input
                  type="range"
                  min="0"
                  max="15"
                  value={ivStaminaMax}
                  onChange={(e) => setIvStaminaMax(Number(e.target.value))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Accuracy Filter */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                🎯 Accuracy: ≥ {accuracyMin}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={accuracyMin}
                onChange={(e) => setAccuracyMin(Number(e.target.value))}
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

        {/* Status Info */}
        <div className="status-info">
          <p>📍 Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}</p>
          <p>🎯 Total Found: {pokemonSpawns.length} | Showing: {filteredPokemon.length} Pokémon</p>
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

        {/* Pokémon Spawn Markers */}
        {filteredPokemon.map((pokemon) => (
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
