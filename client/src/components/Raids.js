import React, { useEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { raidAPI } from '../api';
import { haversineKm, kmToMiles } from '../utils/geo';

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

function createRaidMarkerIcon(level, isMega) {
  const label = isMega ? 'M' : String(level);
  const border = isMega ? '#a2c9ff' : level === 5 ? '#fabd00' : '#64748b';
  const bg = isMega ? '#a2c9ff' : level === 5 ? '#fabd00' : '#32353c';
  const fg = isMega ? '#00315b' : level === 5 ? '#261a00' : '#e1e2eb';
  return L.divIcon({
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="border:2px solid ${border};background:${bg};color:${fg};width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;font-family:Manrope,sans-serif;">
          ${label}
        </div>
      </div>
    `,
    className: 'pokemon-marker',
    iconSize: [44, 56],
    iconAnchor: [22, 48],
    popupAnchor: [0, -40],
  });
}

function formatCountdown(endTime) {
  const sec = Math.floor((new Date(endTime).getTime() - Date.now()) / 1000);
  if (sec < 0) return { text: '00:00', ended: true };
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return { text: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, ended: false };
}

function Raids({ userLocation }) {
  const [raids, setRaids] = useState([]);
  const [filteredRaids, setFilteredRaids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(5);
  const [bossSearch, setBossSearch] = useState('');
  const [levelPreset, setLevelPreset] = useState(null);
  const [megaOnly, setMegaOnly] = useState(false);
  const [minParticipants, setMinParticipants] = useState(0);
  const [minTimeRemaining, setMinTimeRemaining] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [raidListOpen, setRaidListOpen] = useState(false);
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const [, setTick] = useState(0);

  useEffect(() => {
    setRaidListOpen(isMdUp);
  }, [isMdUp]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (!isMdUp && raidListOpen) setRaidListOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMdUp, raidListOpen]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

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

  useEffect(() => {
    const filtered = raids.filter((raid) => {
      if (bossSearch && !raid.bossName.toLowerCase().includes(bossSearch.toLowerCase())) return false;
      if (levelPreset != null && raid.raidLevel !== levelPreset) return false;
      if (megaOnly && !/mega/i.test(raid.bossName)) return false;
      if (raid.participants < minParticipants) return false;
      const timeRemaining = Math.floor((new Date(raid.endTime) - new Date()) / 1000);
      if (timeRemaining < minTimeRemaining) return false;
      return true;
    });
    setFilteredRaids(filtered);
  }, [raids, bossSearch, levelPreset, megaOnly, minParticipants, minTimeRemaining]);

  const isMegaBoss = (name) => /mega/i.test(name || '');

  const raidMeta = (raid) => {
    const mega = isMegaBoss(raid.bossName);
    if (mega) return { line: 'MEGA RAID', accent: 'primary' };
    if (raid.raidLevel === 5) return { line: 'TIER 5 • EXCLUSIVE', accent: 'tertiary' };
    return { line: `TIER ${raid.raidLevel}`, accent: 'outline' };
  };

  const borderClass = (raid) => {
    const mega = isMegaBoss(raid.bossName);
    if (mega) return 'border-l-primary';
    if (raid.raidLevel === 5) return 'border-l-tertiary';
    return 'border-l-outline-variant';
  };

  const sortedList = useMemo(() => {
    return [...filteredRaids].sort(
      (a, b) =>
        haversineKm(userLocation[0], userLocation[1], a.latitude, a.longitude) -
        haversineKm(userLocation[0], userLocation[1], b.latitude, b.longitude)
    );
  }, [filteredRaids, userLocation]);

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-surface-container-low/90 px-3 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
            <div className="relative min-w-0">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">
                search
              </span>
              <input
                className="w-44 border-b border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-2 text-[10px] font-bold uppercase tracking-widest text-on-surface placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-0 sm:w-64 sm:pr-4"
                placeholder="Filter by boss name..."
                value={bossSearch}
                onChange={(e) => setBossSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLevelPreset((p) => (p === 5 ? null : 5))}
                className={`rounded-sm border border-primary/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter ${
                  levelPreset === 5 ? 'bg-primary-container text-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                Tier 5
              </button>
              <button
                type="button"
                onClick={() => setMegaOnly((m) => !m)}
                className={`rounded-sm border border-primary/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter ${
                  megaOnly ? 'bg-primary-container text-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                Mega
              </button>
              <button
                type="button"
                onClick={() => setLevelPreset((p) => (p === 3 ? null : 3))}
                className={`rounded-sm border border-primary/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter ${
                  levelPreset === 3 ? 'bg-primary-container text-primary' : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-variant'
                }`}
              >
                Tier 3
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="rounded-sm border border-outline-variant/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high"
            >
              {showAdvanced ? 'Hide' : 'Advanced'}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!isMdUp && (
              <button
                type="button"
                className="p-2 text-primary hover:text-primary/80 md:hidden"
                onClick={() => setRaidListOpen(true)}
                title="Nearby raids list"
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            )}
            <span className="material-symbols-outlined cursor-default text-slate-400">notifications</span>
            <span className="material-symbols-outlined cursor-default text-slate-400">settings</span>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container-high text-[10px] font-bold text-primary">
              HQ
            </div>
          </div>
        </header>

        {showAdvanced && (
          <div className="border-b border-outline-variant/10 bg-surface-container-lowest px-8 py-4">
            <div className="mx-auto flex max-w-3xl flex-col gap-3 md:flex-row md:items-end">
              <label className="flex flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Radius (km)
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="rounded-sm border border-outline-variant/40 bg-surface-container px-2 py-2 text-on-surface"
                />
              </label>
              <label className="flex flex-[2] flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Min participants ({minParticipants})
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={minParticipants}
                  onChange={(e) => setMinParticipants(Number(e.target.value))}
                  className="accent-primary"
                />
              </label>
              <label className="flex flex-[2] flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Min time left (min): {minTimeRemaining / 60}
                <input
                  type="range"
                  min={0}
                  max={60}
                  value={minTimeRemaining / 60}
                  onChange={(e) => setMinTimeRemaining(Number(e.target.value) * 60)}
                  className="accent-primary"
                />
              </label>
            </div>
          </div>
        )}

        <div className="relative min-h-0 flex-1">
          <MapContainer
            center={userLocation}
            zoom={13}
            className="hq-map-wrap h-full w-full"
            zoomControl
          >
            <RecenterMap center={userLocation} zoom={13} />
            <TileLayer
              attribution='&copy; OpenStreetMap &copy; CARTO'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Marker position={userLocation}>
              <Popup>
                <span className="text-xs text-on-surface">Search center</span>
              </Popup>
            </Marker>
            <Circle
              center={userLocation}
              radius={searchRadius * 1000}
              pathOptions={{ color: '#a2c9ff', weight: 1, fillColor: '#a2c9ff', fillOpacity: 0.06 }}
            />
            {filteredRaids.map((raid) => {
              const mega = isMegaBoss(raid.bossName);
              return (
                <Marker
                  key={raid._id}
                  position={[raid.latitude, raid.longitude]}
                  icon={createRaidMarkerIcon(raid.raidLevel, mega)}
                >
                  <Popup>
                    <div className="font-body text-sm text-on-surface">
                      <p className="font-bold">{raid.gymName}</p>
                      <p>Boss: {raid.bossName}</p>
                      <p>Level {raid.raidLevel}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="pointer-events-auto absolute bottom-24 left-4 z-[500] max-w-[calc(100%-2rem)] border-l-4 border-primary bg-surface-container-low/80 p-4 backdrop-blur-md sm:bottom-8 sm:left-8 sm:max-w-xs">
            <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-tertiary">Weather alert</div>
            <div className="text-sm font-bold uppercase tracking-tight text-on-surface">Windy condition: Dragon boosted</div>
          </div>
        </div>
      </div>

      {!isMdUp && raidListOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[380] bg-black/55 md:hidden"
          aria-label="Close raid list"
          onClick={() => setRaidListOpen(false)}
        />
      )}

      <aside
        className={`flex flex-col border-outline-variant/10 bg-surface-container-low ${
          isMdUp
            ? 'w-96 shrink-0 border-l'
            : `fixed inset-x-0 bottom-0 z-[400] max-h-[min(75vh,560px)] rounded-t-xl border shadow-[0_-12px_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-out ${
                raidListOpen ? 'translate-y-0' : 'translate-y-[110%] pointer-events-none'
              }`
        }`}
      >
        <div className="border-b border-outline-variant/10 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-headline text-sm font-black uppercase tracking-tighter text-on-surface">Nearby raids</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{filteredRaids.length} total</span>
              {!isMdUp && (
                <button
                  type="button"
                  className="rounded-sm p-1.5 text-slate-400 hover:bg-surface-container-high hover:text-on-surface md:hidden"
                  onClick={() => setRaidListOpen(false)}
                  aria-label="Close raid list"
                >
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="hq-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
          {loading && <p className="text-center text-xs text-primary">Loading…</p>}
          {error && <p className="text-center text-xs text-error">{error}</p>}
          {!loading &&
            sortedList.map((raid) => {
              const cd = formatCountdown(raid.endTime);
              const distKm = haversineKm(userLocation[0], userLocation[1], raid.latitude, raid.longitude);
              const distMi = kmToMiles(distKm);
              const meta = raidMeta(raid);
              return (
                <div
                  key={raid._id}
                  className={`group cursor-pointer border-l-2 bg-surface-container-high p-4 transition-all hover:bg-surface-container-highest ${borderClass(raid)}`}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.2em] ${
                          meta.accent === 'tertiary'
                            ? 'text-tertiary'
                            : meta.accent === 'primary'
                              ? 'text-primary'
                              : 'text-outline'
                        }`}
                      >
                        {meta.line}
                      </span>
                      <h3 className="text-lg font-black uppercase leading-tight tracking-tight text-on-surface">
                        {raid.bossName}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold tracking-tighter ${cd.ended ? 'text-error' : 'text-primary'}`}>
                        {cd.text}
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-outline">Remaining</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden bg-surface-container-lowest">
                      <span className="material-symbols-outlined text-outline text-2xl">swords</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-tight text-on-surface">{raid.gymName}</span>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-outline">location_on</span>
                        <span className="text-[9px] font-medium uppercase text-outline">
                          {distMi.toFixed(1)} miles away
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <div className="border-t border-outline-variant/10 bg-surface-container-lowest p-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline">Global raid sync</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">Active</span>
          </div>
          <div className="h-1 w-full bg-surface-container">
            <div className="h-full w-[85%] bg-primary" />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default Raids;
