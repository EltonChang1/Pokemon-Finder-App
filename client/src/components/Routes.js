import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function parseGPX(gpxString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(gpxString, 'text/xml');
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid GPX file');
  }
  const coordinates = [];
  const trkpts = xmlDoc.getElementsByTagName('trkpt');
  for (let i = 0; i < trkpts.length; i++) {
    const lat = parseFloat(trkpts[i].getAttribute('lat'));
    const lon = parseFloat(trkpts[i].getAttribute('lon'));
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      coordinates.push([lat, lon]);
    }
  }
  if (coordinates.length === 0) {
    throw new Error('No coordinates found in GPX file');
  }
  return coordinates;
}

function formatRelative(date) {
  if (!date) return '—';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'Just now';
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

function Routes() {
  const gpxInputRef = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [gpxCoordinates, setGpxCoordinates] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeName, setRouteName] = useState('');
  const [routeSearch, setRouteSearch] = useState('');
  const [listTab, setListTab] = useState('all');

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const response = await routeAPI.getAll();
        setRoutes(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching routes:', err);
        setError('Failed to load routes. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoutes();
  }, []);

  useEffect(() => {
    let list = routes.filter((route) => {
      if (routeSearch && !String(route.name || '').toLowerCase().includes(routeSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
    if (listTab === 'frequent') {
      list = [...list].sort((a, b) => (b.distance || 0) - (a.distance || 0));
    } else if (listTab === 'recent') {
      list = [...list].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
    }
    setFilteredRoutes(list);
  }, [routes, routeSearch, listTab]);

  const totalDistance = useMemo(
    () => routes.reduce((acc, r) => acc + (Number(r.distance) || 0), 0),
    [routes]
  );

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const coordinates = parseGPX(e.target.result);
        setGpxCoordinates(coordinates);
        if (coordinates.length > 0) setMapCenter(coordinates[0]);
        setError(null);
      } catch (err) {
        setError(err.message);
        setGpxCoordinates([]);
      }
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  };

  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      setError('Please enter a route name');
      return;
    }
    if (gpxCoordinates.length === 0) {
      setError('Please upload a GPX file first');
      return;
    }
    const file = gpxInputRef.current?.files?.[0];
    if (!file) {
      setError('Please re-select your GPX file before saving');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let distance = 0;
        for (let i = 1; i < gpxCoordinates.length; i++) {
          const lat1 = gpxCoordinates[i - 1][0];
          const lon1 = gpxCoordinates[i - 1][1];
          const lat2 = gpxCoordinates[i][0];
          const lon2 = gpxCoordinates[i][1];
          const R = 6371;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance += R * c;
        }
        const routeData = {
          name: routeName,
          gpxData: e.target.result,
          distance: Math.round(distance * 100) / 100,
          difficulty: 'Medium',
        };
        const response = await routeAPI.add(routeData);
        setRoutes((prev) => [...prev, response.data]);
        setRouteName('');
        setGpxCoordinates([]);
        if (gpxInputRef.current) gpxInputRef.current.value = '';
        setError(null);
      } catch (err) {
        setError('Failed to save route: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const loadSavedRoute = (route) => {
    try {
      const coordinates = parseGPX(route.gpxData);
      setGpxCoordinates(coordinates);
      setSelectedRoute(route);
      if (coordinates.length > 0) setMapCenter(coordinates[0]);
      setError(null);
    } catch (err) {
      setError('Failed to load route: ' + err.message);
    }
  };

  const topRoutes = filteredRoutes.slice(0, 3);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant/10 bg-[#10131a]/90 px-6 backdrop-blur-xl">
        <div className="relative max-w-xl flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            search
          </span>
          <input
            className="w-full border-b border-outline-variant/30 bg-surface-container-lowest py-2 pl-10 pr-4 text-[10px] font-bold uppercase tracking-widest text-on-surface placeholder:text-slate-600 focus:border-primary focus:outline-none focus:ring-0"
            placeholder="Search operational routes..."
            value={routeSearch}
            onChange={(e) => setRouteSearch(e.target.value)}
          />
        </div>
        <div className="ml-4 flex items-center gap-3">
          <input ref={gpxInputRef} type="file" accept=".gpx" className="hidden" onChange={handleFileUpload} />
          <button
            type="button"
            onClick={() => gpxInputRef.current?.click()}
            className="flex items-center gap-2 rounded-sm bg-surface-container-high px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Import GPX
          </button>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="New route name"
            className="hidden w-40 rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-2 py-2 text-xs text-on-surface md:block"
          />
          <button
            type="button"
            onClick={handleSaveRoute}
            disabled={loading || gpxCoordinates.length === 0}
            className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-primary transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Create new route
          </button>
          <div className="mx-2 hidden h-6 w-px bg-outline-variant/20 md:block" />
          <span className="material-symbols-outlined hidden cursor-default text-slate-400 md:inline">notifications</span>
          <span className="material-symbols-outlined hidden cursor-default text-slate-400 md:inline">settings</span>
        </div>
      </header>

      <div className="hq-scrollbar flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-headline text-3xl font-black uppercase tracking-tighter text-slate-100">Active routes</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Intelligence grid: {routes.length} sectors mapping
            </p>
          </div>
          <div className="flex gap-2">
            {['all', 'frequent', 'recent'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setListTab(tab)}
                className={`rounded-sm px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                  listTab === tab
                    ? 'bg-surface-container-highest text-primary'
                    : 'bg-surface-container text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab === 'all' ? 'All routes' : tab === 'frequent' ? 'Frequent' : 'Recent'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-sm border border-error/40 bg-error-container/20 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div className="mb-6 flex flex-col gap-3 rounded-sm border border-outline-variant/20 bg-surface-container-low p-4 md:flex-row md:items-center">
          <p className="text-xs text-on-surface-variant">
            Name new route, import GPX, then <span className="font-bold text-primary">Create new route</span> to persist.
          </p>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="Route name"
            className="md:hidden rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {topRoutes.map((route, idx) => (
            <button
              key={route._id}
              type="button"
              onClick={() => loadSavedRoute(route)}
              className={`group flex flex-col overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container text-left transition-all hover:bg-surface-container-high ${
                selectedRoute?._id === route._id ? 'ring-1 ring-primary' : ''
              }`}
            >
              <div className="relative h-48 overflow-hidden bg-surface-container-low">
                <div className="absolute inset-0 map-mesh opacity-50" />
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,77,137,0.35) 0%, rgba(11,14,20,0.9) 100%)`,
                  }}
                />
                {idx === 0 && (
                  <div className="absolute right-4 top-4 rounded-sm border border-tertiary/30 bg-tertiary/20 px-2 py-1 backdrop-blur-md">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-tertiary">Rare spawns active</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-primary">
                    Sector {String(route._id || '').slice(-3).toUpperCase() || '—'}
                  </span>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-slate-100">{route.name}</h3>
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Distance</p>
                    <p className="font-headline text-lg font-bold text-slate-200">{route.distance ?? '?'} km</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Last hunted</p>
                    <p className="font-headline text-lg font-bold text-slate-200">{formatRelative(route.updatedAt || route.createdAt)}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-outline-variant/10 pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{route.difficulty || 'Medium'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tactical data →</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="group flex overflow-hidden rounded-sm border border-outline-variant/10 bg-surface-container transition-all hover:bg-surface-container-high xl:col-span-2">
            <div className="relative w-full min-h-[200px] bg-surface-container-low md:w-1/2">
              <div className="absolute inset-0 map-mesh opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container" />
            </div>
            <div className="flex w-full flex-col p-8 md:w-1/2">
              <span className="mb-4 inline-block w-fit rounded-sm bg-tertiary px-2 py-1 text-[8px] font-black uppercase tracking-tighter text-on-tertiary">
                Hotzone detected
              </span>
              <h3 className="text-3xl font-black uppercase leading-none tracking-tighter text-slate-100">Coastal perimeter intel</h3>
              <p className="mt-2 text-xs font-medium text-slate-500">
                Aggregated patrol data from saved routes. Select a route card to load GPX geometry into the tactical preview
                below.
              </p>
              <div className="mb-8 mt-6 grid grid-cols-3 gap-6">
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Yield</p>
                  <p className="font-headline text-xl font-bold text-tertiary">{routes.length ? 'High' : 'Low'}</p>
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Total km</p>
                  <p className="font-headline text-xl font-bold text-slate-200">{totalDistance.toFixed(2)}</p>
                </div>
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">Routes</p>
                  <p className="font-headline text-xl font-bold text-slate-200">{routes.length}</p>
                </div>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => topRoutes[0] && loadSavedRoute(topRoutes[0])}
                  className="rounded-sm bg-primary px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-on-primary hover:opacity-90"
                >
                  Launch mission
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">View all sub-routes in grid</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-sm border border-outline-variant/10 bg-surface-container-low p-6">
            <div>
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-primary">Tactical summary</p>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">TOTAL DISTANCE</span>
                  <span className="font-headline text-xs font-bold text-slate-100">{totalDistance.toFixed(1)} km</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest">
                  <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, totalDistance * 2)}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">ROUTES ON FILE</span>
                  <span className="font-headline text-xs font-bold text-slate-100">{routes.length}</span>
                </div>
                <div className="h-1 w-full bg-surface-container-highest">
                  <div className="h-full bg-tertiary" style={{ width: `${Math.min(100, routes.length * 10)}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-outline-variant/10 pt-6">
              <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Recent milestones</p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-container">
                  <span className="material-symbols-outlined text-sm text-tertiary">military_tech</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-tight text-slate-200">Centurion walker</p>
                  <p className="text-[9px] uppercase text-slate-500">{totalDistance >= 100 ? '100km total reached' : 'Keep walking'}</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-sm bg-surface-container-high py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-colors hover:bg-surface-variant hover:text-on-surface"
            >
              Generate report
            </button>
          </div>
        </div>

        {gpxCoordinates.length > 0 && (
          <div className="mt-8 h-72 overflow-hidden rounded-sm border border-outline-variant/20">
            <MapContainer center={mapCenter} zoom={13} className="hq-map-wrap h-full w-full" style={{ minHeight: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap &copy; CARTO'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <Polyline positions={gpxCoordinates} pathOptions={{ color: '#a2c9ff', weight: 4, opacity: 0.9 }} />
              <Marker position={gpxCoordinates[0]}>
                <Popup>Start</Popup>
              </Marker>
              {gpxCoordinates.length > 1 && (
                <Marker position={gpxCoordinates[gpxCoordinates.length - 1]}>
                  <Popup>End</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
        )}

        {loading && <p className="mt-6 text-center text-sm text-primary">Loading routes…</p>}
        {!loading && filteredRoutes.length === 0 && (
          <p className="mt-6 text-center text-sm text-on-surface-variant">No routes match your search.</p>
        )}
      </div>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-outline-variant/5 bg-surface-container-lowest px-6 text-[8px] font-bold uppercase tracking-widest text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span>Global server: Online</span>
          </div>
          <div className="hidden h-3 w-px bg-outline-variant/20 sm:block" />
          <span className="hidden sm:inline">GPS precision: simulated</span>
        </div>
        <div className="flex items-center gap-4">
          <span>API latency: —</span>
          <span className="text-slate-200">{new Date().toISOString().slice(11, 19)} UTC</span>
        </div>
      </footer>

      <div className="pointer-events-none absolute inset-0 z-40 border-[16px] border-surface opacity-10" />
      <div className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,_transparent_0%,_#10131a_100%)] opacity-30" />
    </div>
  );
}

export default Routes;
