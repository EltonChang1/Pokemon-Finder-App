import React, { useState } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import Map from './components/Map';
import Routes from './components/Routes';
import Raids from './components/Raids';
import LocationSearchModal from './components/LocationSearchModal';
import HQSidebar from './components/hq/HQSidebar';
import ReportSightingModal from './components/hq/ReportSightingModal';
import './index.css';
import './hq-overrides.css';

function App() {
  const [userLocation, setUserLocation] = useState([40.4406, -79.9959]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-background text-on-background">
        <HQSidebar onReport={() => setReportOpen(true)} />
        <div className="ml-60 flex min-h-0 min-w-0 flex-1 flex-col">
          <Route
            exact
            path="/"
            render={() => (
              <Map
                userLocation={userLocation}
                setUserLocation={setUserLocation}
                onOpenLocationModal={() => setIsLocationModalOpen(true)}
              />
            )}
          />
          <Route path="/raids" render={() => <Raids userLocation={userLocation} />} />
          <Route path="/routes" component={Routes} />
        </div>

        <LocationSearchModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationChange={setUserLocation}
          currentLocation={userLocation}
        />
        <ReportSightingModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      </div>
    </Router>
  );
}

export default App;
