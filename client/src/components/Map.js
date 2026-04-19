import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { pokemonAPI } from '../api';
import { geocodeAddress, parseLatLngPair } from '../utils/geocode';
import { haversineKm } from '../utils/geo';
import { useMediaQuery } from '../hooks/useMediaQuery';

const RARITY_BORDER = {
  Common: '#64748b',
  Uncommon: '#3b82f6',
  Rare: '#f59e0b',
  'Very Rare': '#ef4444',
  Legendary: '#a855f7',
};

function totalIvPercent(p) {
  const a = p.iv_attack || 0;
  const d = p.iv_defense || 0;
  const s = p.iv_stamina || 0;
  return ((a + d + s) / 45) * 100;
}

function createPokemonIcon(pokedexId, rarity, isPerfect) {
  const id = Number(pokedexId);
  const hasSprite = Number.isFinite(id) && id > 0;
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  const border = RARITY_BORDER[rarity] || RARITY_BORDER.Common;
  const glow = isPerfect ? 'box-shadow:0 0 24px rgba(250,189,0,0.55);' : 'box-shadow:0 4px 14px rgba(0,0,0,0.45);';
  const inner = hasSprite
    ? `<img src="${spriteUrl}" alt="" style="width:32px;height:32px;display:block;image-rendering:pixelated;" />`
    : `<span style="display:flex;width:32px;height:32px;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#a2c9ff;">?</span>`;
  return L.divIcon({
    html: `
      <div style="position:relative;width:44px;height:44px;">
        ${isPerfect ? '<div style="position:absolute;inset:-6px;background:rgba(250,189,0,0.25);border-radius:50%;filter:blur(8px);"></div>' : ''}
        <div style="position:relative;background:#191c22;border:2px solid ${border};border-radius:6px;padding:3px;${glow}">
          ${inner}
        </div>
        ${
          isPerfect
            ? '<div style="position:absolute;top:-8px;right:-8px;background:#fabd00;color:#261a00;font-size:7px;font-weight:900;padding:2px 4px;border-radius:3px;text-transform:uppercase;">100 IV</div>'
            : ''
        }
      </div>
    `,
    className: 'pokemon-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
}

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

function MapFloatingControls({ setUserLocation, anchorClass = 'bottom-24 left-4 md:bottom-8 md:left-8' }) {
  const map = useMap();
  return (
    <div
      className={`pointer-events-auto absolute z-[1000] flex flex-col gap-2 ${anchorClass}`}
    >
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center border border-outline-variant/20 bg-surface-container-low/90 text-on-surface backdrop-blur-md transition-colors hover:text-primary"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        <span className="material-symbols-outlined text-xl">add</span>
      </button>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center border border-outline-variant/20 bg-surface-container-low/90 text-on-surface backdrop-blur-md transition-colors hover:text-primary"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        <span className="material-symbols-outlined text-xl">remove</span>
      </button>
      <div className="h-2" />
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center border border-outline-variant/20 bg-surface-container-low/90 text-on-surface backdrop-blur-md transition-colors hover:text-primary"
        onClick={() => {
          if (!navigator.geolocation) return;
          navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
            () => {},
            { enableHighAccuracy: true, timeout: 12000 }
          );
        }}
        aria-label="Locate me"
      >
        <span className="material-symbols-outlined text-xl">my_location</span>
      </button>
    </div>
  );
}

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'];

const RARITY_LABEL = {
  Common: 'Commons',
  Uncommon: 'Uncommon',
  Rare: 'Rare',
  'Very Rare': 'Elite',
  Legendary: 'Legendary',
};

function Map({ userLocation, setUserLocation, onOpenLocationModal, spawnDataVersion = 0 }) {
  const [pokemonSpawns, setPokemonSpawns] = useState([]);
  const [filteredPokemon, setFilteredPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);

  const [nameSearch, setNameSearch] = useState('');
  const [selectedRarities, setSelectedRarities] = useState({
    Common: true,
    Uncommon: true,
    Rare: true,
    'Very Rare': true,
    Legendary: true,
  });
  const [ivAttackMin, setIvAttackMin] = useState(0);
  const [ivAttackMax, setIvAttackMax] = useState(15);
  const [ivDefenseMin, setIvDefenseMin] = useState(0);
  const [ivDefenseMax, setIvDefenseMax] = useState(15);
  const [ivStaminaMin, setIvStaminaMin] = useState(0);
  const [ivStaminaMax, setIvStaminaMax] = useState(15);
  const [accuracyMin, setAccuracyMin] = useState(0);
  const [ivPctMin, setIvPctMin] = useState(0);
  const [ivPctMax, setIvPctMax] = useState(100);
  const [selectedDex, setSelectedDex] = useState(() => new Set());

  const [scanQuery, setScanQuery] = useState('');
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [priorityDismissed, setPriorityDismissed] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const scanGeocodeAbort = useRef(null);

  useEffect(() => {
    setFilterSheetOpen(isMdUp);
  }, [isMdUp]);

  useEffect(() => {
    setPriorityDismissed(false);
  }, [userLocation, searchRadius, pokemonSpawns]);

  useEffect(() => {
    setScanError(null);
  }, [scanQuery]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (!isMdUp && filterSheetOpen) setFilterSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMdUp, filterSheetOpen]);

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
  }, [userLocation, searchRadius, spawnDataVersion]);

  useEffect(() => {
    const filtered = pokemonSpawns.filter((pokemon) => {
      if (nameSearch && !pokemon.name.toLowerCase().includes(nameSearch.toLowerCase())) return false;
      if (!selectedRarities[pokemon.rarity]) return false;
      if ((pokemon.iv_attack || 0) < ivAttackMin || (pokemon.iv_attack || 0) > ivAttackMax) return false;
      if ((pokemon.iv_defense || 0) < ivDefenseMin || (pokemon.iv_defense || 0) > ivDefenseMax) return false;
      if ((pokemon.iv_stamina || 0) < ivStaminaMin || (pokemon.iv_stamina || 0) > ivStaminaMax) return false;
      if ((pokemon.accuracy || 100) < accuracyMin) return false;
      const pct = totalIvPercent(pokemon);
      if (pct < ivPctMin || pct > ivPctMax) return false;
      if (selectedDex.size > 0) {
        const id = pokemon.pokedexId;
        if (id == null || !selectedDex.has(id)) return false;
      }
      return true;
    });
    setFilteredPokemon(filtered);
  }, [
    pokemonSpawns,
    nameSearch,
    selectedRarities,
    ivAttackMin,
    ivAttackMax,
    ivDefenseMin,
    ivDefenseMax,
    ivStaminaMin,
    ivStaminaMax,
    accuracyMin,
    ivPctMin,
    ivPctMax,
    selectedDex,
  ]);

  const uniqueSpecies = useMemo(() => {
    const m = new window.Map();
    pokemonSpawns.forEach((p) => {
      if (p.pokedexId != null && !m.has(p.pokedexId)) m.set(p.pokedexId, p);
    });
    return Array.from(m.values()).slice(0, 16);
  }, [pokemonSpawns]);

  const prioritySpawn = useMemo(() => {
    return pokemonSpawns.find((p) => {
      if (totalIvPercent(p) < 99.5) return false;
      const d = haversineKm(userLocation[0], userLocation[1], p.latitude, p.longitude);
      return d <= 0.5;
    });
  }, [pokemonSpawns, userLocation]);

  const handleRarityToggle = (rarity) => {
    setSelectedRarities((prev) => ({ ...prev, [rarity]: !prev[rarity] }));
  };

  const toggleSpecies = (dex) => {
    setSelectedDex((prev) => {
      const next = new Set(prev);
      if (next.has(dex)) next.delete(dex);
      else next.add(dex);
      return next;
    });
  };

  const resetFilters = () => {
    if (!isMdUp) setFilterSheetOpen(false);
    setNameSearch('');
    setSelectedRarities({
      Common: true,
      Uncommon: true,
      Rare: true,
      'Very Rare': true,
      Legendary: true,
    });
    setIvAttackMin(0);
    setIvAttackMax(15);
    setIvDefenseMin(0);
    setIvDefenseMax(15);
    setIvStaminaMin(0);
    setIvStaminaMax(15);
    setAccuracyMin(0);
    setIvPctMin(0);
    setIvPctMax(100);
    setSelectedDex(new Set());
  };

  const handleScanSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const q = scanQuery.trim();
      if (!q) return;
      const coords = parseLatLngPair(q);
      if (coords) {
        setUserLocation(coords);
        setScanQuery('');
        setScanError(null);
        return;
      }
      scanGeocodeAbort.current?.abort();
      const ac = new AbortController();
      scanGeocodeAbort.current = ac;
      try {
        setScanBusy(true);
        setScanError(null);
        const loc = await geocodeAddress(q, ac.signal);
        if (loc) {
          setUserLocation(loc);
          setScanQuery('');
          setScanError(null);
        } else {
          setScanError('No location found for that search. Try a fuller address or use Tune for advanced search.');
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (err.message === 'RATE_LIMIT') {
          setScanError('Too many searches. Wait a second and try again.');
        } else {
          setScanError('Location search failed. Check your connection or use Tune for coordinates.');
        }
      } finally {
        if (!ac.signal.aborted) setScanBusy(false);
      }
    },
    [scanQuery, setUserLocation]
  );

  const rarityLine = (r) => {
    if (r === 'Very Rare') return 'Ultra Rare Spawn';
    return `${r} Spawn`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-[#10131a]/90 px-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-6">
          <span className="hidden shrink-0 text-xl font-black uppercase tracking-tighter text-slate-100 sm:inline">
            PokeFind
          </span>
          <form className="relative min-w-0 max-w-md flex-1" onSubmit={handleScanSubmit}>
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              search
            </span>
            <input
              className="w-full border-b border-transparent bg-surface-container-lowest py-2 pl-10 pr-4 font-body text-sm text-on-surface placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-0"
              placeholder="Scan coordinate or address..."
              value={scanQuery}
              onChange={(e) => setScanQuery(e.target.value)}
              disabled={scanBusy}
            />
          </form>
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          {!isMdUp && (
            <button
              type="button"
              className="p-2 text-primary transition-colors hover:text-primary/80 md:hidden"
              onClick={() => setFilterSheetOpen(true)}
              title="Spawn filters"
              aria-expanded={filterSheetOpen}
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
          )}
          <button
            type="button"
            className="p-2 text-slate-400 transition-colors hover:text-primary"
            onClick={onOpenLocationModal}
            title="Advanced location search"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
          <span className="material-symbols-outlined cursor-default text-slate-500">notifications</span>
          <span className="material-symbols-outlined cursor-default text-slate-500">settings</span>
          <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high text-[10px] font-bold text-primary">
            HQ
          </div>
        </div>
      </header>

      {scanError && (
        <div
          className="shrink-0 border-b border-error/25 bg-error-container/15 px-4 py-2 text-center text-xs text-error"
          role="alert"
        >
          {scanError}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-0 z-10 map-mesh opacity-30" />
        <MapContainer
          center={userLocation}
          zoom={13}
          className="hq-map-wrap h-full w-full"
          zoomControl={false}
        >
          <RecenterMap center={userLocation} zoom={13} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapFloatingControls setUserLocation={setUserLocation} />

          <Marker position={userLocation}>
            <Popup>
              <div className="font-body text-on-surface">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">Search center</p>
                <p className="text-[11px] text-on-surface-variant">
                  {userLocation[0].toFixed(5)}, {userLocation[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>

          <Circle
            center={userLocation}
            radius={searchRadius * 1000}
            pathOptions={{
              color: '#a2c9ff',
              weight: 1,
              fillColor: '#a2c9ff',
              fillOpacity: 0.06,
            }}
          />

          {filteredPokemon.map((pokemon) => {
            const pct = totalIvPercent(pokemon);
            const perfect = pct >= 99.9;
            return (
              <Marker
                key={pokemon._id}
                position={[pokemon.latitude, pokemon.longitude]}
                icon={createPokemonIcon(pokemon.pokedexId, pokemon.rarity, perfect)}
              >
                <Popup>
                  <div className="font-body text-on-surface">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">
                          {rarityLine(pokemon.rarity)}
                        </p>
                        <h3 className="text-lg font-bold tracking-tight">
                          {pokemon.pokedexId != null ? `#${pokemon.pokedexId} ` : ''}
                          {pokemon.name}
                        </h3>
                      </div>
                      <div className="rounded-sm bg-surface-container-highest px-2 py-1 text-[10px] font-bold text-primary">
                        {pct.toFixed(1)}% IV
                      </div>
                    </div>
                    <div className="mb-3 grid grid-cols-3 gap-1">
                      {['iv_attack', 'iv_defense', 'iv_stamina'].map((k, i) => (
                        <div key={k} className="rounded-sm bg-surface-container p-2 text-center">
                          <p className="text-[8px] font-bold uppercase text-slate-500">
                            {['ATK', 'DEF', 'STA'][i]}
                          </p>
                          <p className="text-sm font-bold">{pokemon[k] ?? 0}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Despawns:{' '}
                      {pokemon.despawnTime ? new Date(pokemon.despawnTime).toLocaleTimeString() : '—'}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">Accuracy: {pokemon.accuracy ?? 100}%</p>
                    <a
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm bg-gradient-to-r from-primary to-primary-container py-2 text-xs font-bold uppercase tracking-widest text-on-primary"
                      href={`https://www.google.com/maps/dir/?api=1&destination=${pokemon.latitude},${pokemon.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="material-symbols-outlined text-sm">directions</span>
                      Get Directions
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {!isMdUp && filterSheetOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[380] bg-black/55 md:hidden"
            aria-label="Close filters"
            onClick={() => setFilterSheetOpen(false)}
          />
        )}

        <aside
          className={`flex flex-col border-outline-variant/10 bg-surface-container-low/95 backdrop-blur-md ${
            isMdUp
              ? 'absolute bottom-0 right-0 top-0 z-[420] w-80 border-l'
              : `fixed inset-x-0 bottom-0 z-[400] max-h-[min(78vh,640px)] rounded-t-xl border shadow-[0_-12px_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
                  filterSheetOpen ? 'translate-y-0' : 'translate-y-[110%] pointer-events-none'
                }`
          }`}
        >
          <div className="flex items-center justify-between border-b border-outline-variant/10 p-5">
            <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Spawn Filters</h2>
            <div className="flex items-center gap-1">
              {!isMdUp && (
                <button
                  type="button"
                  className="rounded-sm p-1.5 text-slate-400 hover:bg-surface-container-high hover:text-on-surface md:hidden"
                  onClick={() => setFilterSheetOpen(false)}
                  aria-label="Close filters"
                >
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              )}
              <span className="material-symbols-outlined text-slate-500">tune</span>
            </div>
          </div>

          <div className="hq-scrollbar flex-1 space-y-8 overflow-y-auto p-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Scan radius (km)</p>
              <input
                type="number"
                min={1}
                max={20}
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full rounded-sm border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Name contains</p>
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Species…"
                className="w-full rounded-sm border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">Filter by rarity</p>
              <div className="flex flex-wrap gap-2">
                {RARITIES.map((r) => {
                  const on = selectedRarities[r];
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRarityToggle(r)}
                      className={`rounded-sm px-3 py-1 text-[10px] font-bold uppercase transition-colors ${
                        on
                          ? r === 'Legendary'
                            ? 'bg-tertiary text-on-tertiary shadow-[0_0_10px_rgba(250,189,0,0.3)]'
                            : 'bg-primary-container text-primary'
                          : 'bg-surface-container-highest text-on-surface-variant hover:bg-primary-container/20'
                      }`}
                    >
                      {RARITY_LABEL[r]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">IV threshold (total %)</p>
                <span className="text-xs font-bold text-primary">
                  {ivPctMin}% – {ivPctMax}%
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-on-surface-variant">Minimum</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ivPctMin}
                  onChange={(e) => setIvPctMin(Math.min(Number(e.target.value), ivPctMax))}
                  className="w-full accent-primary"
                />
                <label className="text-[10px] text-on-surface-variant">Maximum</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ivPctMax}
                  onChange={(e) => setIvPctMax(Math.max(Number(e.target.value), ivPctMin))}
                  className="w-full accent-primary"
                />
              </div>
            </div>

            <details className="rounded-sm border border-outline-variant/20 bg-surface-container/50 p-3">
              <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Advanced IV & accuracy
              </summary>
              <div className="mt-4 space-y-4 text-[11px] text-on-surface-variant">
                <p>ATK {ivAttackMin}–{ivAttackMax}</p>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={ivAttackMin}
                    onChange={(e) => setIvAttackMin(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={ivAttackMax}
                    onChange={(e) => setIvAttackMax(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                </div>
                <p>DEF {ivDefenseMin}–{ivDefenseMax}</p>
                <div className="flex gap-2">
                  <input type="range" min={0} max={15} value={ivDefenseMin} onChange={(e) => setIvDefenseMin(Number(e.target.value))} className="flex-1 accent-primary" />
                  <input type="range" min={0} max={15} value={ivDefenseMax} onChange={(e) => setIvDefenseMax(Number(e.target.value))} className="flex-1 accent-primary" />
                </div>
                <p>STA {ivStaminaMin}–{ivStaminaMax}</p>
                <div className="flex gap-2">
                  <input type="range" min={0} max={15} value={ivStaminaMin} onChange={(e) => setIvStaminaMin(Number(e.target.value))} className="flex-1 accent-primary" />
                  <input type="range" min={0} max={15} value={ivStaminaMax} onChange={(e) => setIvStaminaMax(Number(e.target.value))} className="flex-1 accent-primary" />
                </div>
                <p>Min accuracy {accuracyMin}%</p>
                <input type="range" min={0} max={100} value={accuracyMin} onChange={(e) => setAccuracyMin(Number(e.target.value))} className="w-full accent-primary" />
              </div>
            </details>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-tertiary">
                Active species ({uniqueSpecies.length})
              </p>
              <div className="grid grid-cols-4 gap-2">
                {uniqueSpecies.map((p) => {
                  const active = selectedDex.has(p.pokedexId);
                  return (
                    <button
                      key={p.pokedexId}
                      type="button"
                      onClick={() => toggleSpecies(p.pokedexId)}
                      className={`flex aspect-square items-center justify-center rounded-sm border p-1 transition-colors ${
                        active ? 'border-primary/50 bg-surface-container-high' : 'border-outline-variant/15 bg-surface-container'
                      }`}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokedexId}.png`}
                        alt=""
                        className={active ? 'h-8 w-8 opacity-90' : 'h-8 w-8 opacity-40'}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-on-surface-variant">Tap species to show only those (empty = all).</p>
            </div>
          </div>

          <div className="border-t border-outline-variant/10 bg-surface-container-lowest p-5">
            <div className="mb-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span>Live tracking</span>
              <span className="flex items-center gap-1 text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Active
              </span>
            </div>
            <p className="mb-3 text-[10px] text-on-surface-variant">
              Showing {filteredPokemon.length} of {pokemonSpawns.length} in radius
            </p>
            {loading && <p className="mb-2 text-[10px] text-primary">Syncing…</p>}
            {error && <p className="mb-2 text-[10px] text-error">{error}</p>}
            <button
              type="button"
              onClick={resetFilters}
              className="w-full rounded-sm bg-surface-variant py-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
            >
              Clear all filters
            </button>
          </div>
        </aside>

        {prioritySpawn && !priorityDismissed && (
          <div className="absolute left-4 right-4 top-24 z-[430] flex items-center gap-4 border-l-4 border-tertiary bg-surface-container-highest/90 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-[21rem] sm:top-20 sm:max-w-sm">
            <div className="rounded-sm bg-tertiary/20 p-2">
              <span className="material-symbols-outlined text-tertiary">warning</span>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">Priority alert</p>
              <p className="text-xs font-medium text-on-surface">
                New <span className="font-bold">100% IV {prioritySpawn.name}</span> detected within 500m.
              </p>
            </div>
            <button
              type="button"
              className="ml-auto text-slate-500 hover:text-on-surface"
              onClick={() => setPriorityDismissed(true)}
              aria-label="Dismiss"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Map;
