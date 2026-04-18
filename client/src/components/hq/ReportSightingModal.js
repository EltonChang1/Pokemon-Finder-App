import React, { useEffect, useState } from 'react';
import { pokemonAPI } from '../../api';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'];

function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ReportSightingModal({ isOpen, onClose, userLocation, onSuccess }) {
  const [name, setName] = useState('');
  const [pokedexId, setPokedexId] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [rarity, setRarity] = useState('Rare');
  const [despawnLocal, setDespawnLocal] = useState(() => toDatetimeLocalValue(new Date(Date.now() + 30 * 60 * 1000)));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    if (userLocation?.length === 2) {
      setLat(String(userLocation[0].toFixed(5)));
      setLng(String(userLocation[1].toFixed(5)));
    }
    setDespawnLocal(toDatetimeLocalValue(new Date(Date.now() + 30 * 60 * 1000)));
    setMessage(null);
  }, [isOpen, userLocation]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const n = name.trim();
    if (!n) {
      setMessage('Species name is required.');
      return;
    }
    const la = parseFloat(lat);
    const lo = parseFloat(lng);
    if (Number.isNaN(la) || Number.isNaN(lo)) {
      setMessage('Valid latitude and longitude are required.');
      return;
    }
    if (la < -90 || la > 90 || lo < -180 || lo > 180) {
      setMessage('Coordinates are out of range.');
      return;
    }

    const payload = {
      name: n,
      latitude: la,
      longitude: lo,
      rarity,
      despawnTime: despawnLocal ? new Date(despawnLocal).toISOString() : undefined,
    };
    const dex = parseInt(pokedexId, 10);
    if (!Number.isNaN(dex) && dex > 0) {
      payload.pokedexId = dex;
    }

    try {
      setBusy(true);
      await pokemonAPI.add(payload);
      setName('');
      setPokedexId('');
      setMessage(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit sighting.';
      setMessage(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-sm border border-outline-variant/30 bg-surface-container-low p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-title"
      >
        <h2 id="report-title" className="text-lg font-bold text-on-surface">
          Report a sighting
        </h2>
        <p className="mt-2 text-xs text-on-surface-variant">
          Creates a spawn via <span className="font-mono text-primary">POST /api/pokemon-spawns</span>. Use only for
          data you are allowed to share.
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
            Species name *
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              placeholder="e.g. Gible"
              autoComplete="off"
            />
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
            Pokédex # (optional)
            <input
              value={pokedexId}
              onChange={(e) => setPokedexId(e.target.value.replace(/[^\d]/g, ''))}
              className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              placeholder="443"
              inputMode="numeric"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
              Latitude *
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
              Longitude *
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
            </label>
          </div>

          <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
            Rarity *
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-[10px] font-bold uppercase tracking-widest text-tertiary">
            Despawn (local time)
            <input
              type="datetime-local"
              value={despawnLocal}
              onChange={(e) => setDespawnLocal(e.target.value)}
              className="mt-1 w-full rounded-sm border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            />
          </label>

          {message && <p className="text-sm text-error">{message}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-sm bg-surface-variant py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-sm bg-tertiary py-2.5 text-xs font-black uppercase tracking-widest text-on-tertiary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? 'Submitting…' : 'Submit sighting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportSightingModal;
