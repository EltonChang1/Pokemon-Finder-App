import React from 'react';
import { NavLink } from 'react-router-dom';

const navClass =
  'flex items-center gap-3 py-3 px-4 text-slate-500 hover:text-slate-300 hover:bg-slate-800/20 transition-all font-label uppercase tracking-[0.1em] text-[10px] font-bold';
const activeClass =
  'flex items-center gap-3 py-3 px-4 text-primary border-l-2 border-tertiary bg-slate-800/30 transition-all duration-150 font-label uppercase tracking-[0.1em] text-[10px] font-bold';

function HQSidebar({ onReport, isDesktop, mobileOpen, onRequestClose }) {
  const closeIfMobile = () => {
    if (!isDesktop) onRequestClose?.();
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-[600] flex h-full w-60 flex-col border-r border-slate-800/10 bg-[#10131a] transition-transform duration-200 ease-out md:translate-x-0 ${
        isDesktop || mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-start justify-between gap-2 p-6 pb-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-widest text-blue-400">PokeFind HQ</h1>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
            Operational Intel
          </p>
        </div>
        {!isDesktop && (
          <button
            type="button"
            className="shrink-0 rounded-sm p-1.5 text-slate-400 hover:bg-surface-container-high hover:text-on-surface md:hidden"
            onClick={onRequestClose}
            aria-label="Close navigation"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-2">
        <NavLink
          exact
          to="/"
          className={navClass}
          activeClassName={activeClass}
          onClick={closeIfMobile}
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          Map
        </NavLink>
        <NavLink to="/raids" className={navClass} activeClassName={activeClass} onClick={closeIfMobile}>
          <span className="material-symbols-outlined text-[20px]">radar</span>
          Raids
        </NavLink>
        <NavLink to="/routes" className={navClass} activeClassName={activeClass} onClick={closeIfMobile}>
          <span className="material-symbols-outlined text-[20px]">conversion_path</span>
          Routes
        </NavLink>
      </nav>
      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={() => {
            onReport?.();
            closeIfMobile();
          }}
          className="w-full rounded-sm bg-tertiary py-3 text-[10px] font-black uppercase tracking-widest text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:brightness-110"
        >
          Report Sighting
        </button>
        <div className="mt-6 flex items-center gap-3 border-t border-outline-variant/10 px-2 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-[10px] font-bold text-primary">
            PF
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-on-surface">Trainer</p>
            <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">Field Operative</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default HQSidebar;
