import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Map from './components/Map';
import Routes from './components/Routes';
import Raids from './components/Raids';
import LocationSearchModal from './components/LocationSearchModal';
import HQSidebar from './components/hq/HQSidebar';
import ReportSightingModal from './components/hq/ReportSightingModal';
import { DocumentTitle } from './components/hq/DocumentTitle';
import { useMediaQuery } from './hooks/useMediaQuery';
import './index.css';
import './hq-overrides.css';

function App() {
  const [userLocation, setUserLocation] = useState([40.4406, -79.9959]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [spawnDataVersion, setSpawnDataVersion] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (reportOpen) {
        setReportOpen(false);
        return;
      }
      if (isLocationModalOpen) {
        setIsLocationModalOpen(false);
        return;
      }
      if (!isDesktop && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportOpen, isLocationModalOpen, isDesktop, mobileNavOpen]);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-background text-on-background">
        <DocumentTitle />
        {!isDesktop && mobileNavOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[550] bg-black/60 md:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <HQSidebar
          isDesktop={isDesktop}
          mobileOpen={mobileNavOpen}
          onRequestClose={() => setMobileNavOpen(false)}
          onReport={() => setReportOpen(true)}
        />

        <div className="ml-0 flex min-h-0 min-w-0 flex-1 flex-col md:ml-60">
          <header className="flex h-11 shrink-0 items-center gap-2 border-b border-outline-variant/10 bg-[#10131a] px-2 md:hidden">
            <button
              type="button"
              className="rounded-sm p-2 text-on-surface hover:bg-surface-container-high"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary">PokeFind HQ</span>
          </header>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Route
              exact
              path="/"
              render={() => (
                <Map
                  userLocation={userLocation}
                  setUserLocation={setUserLocation}
                  onOpenLocationModal={() => setIsLocationModalOpen(true)}
                  spawnDataVersion={spawnDataVersion}
                />
              )}
            />
            <Route path="/raids" render={() => <Raids userLocation={userLocation} />} />
            <Route path="/routes" component={Routes} />
          </div>
        </div>

        <LocationSearchModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationChange={setUserLocation}
          currentLocation={userLocation}
        />
        <ReportSightingModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          userLocation={userLocation}
          onSuccess={() => setSpawnDataVersion((v) => v + 1)}
        />
      </div>
    </Router>
  );
}

export default App;
