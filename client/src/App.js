import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Map from './components/Map';
import Routes from './components/Routes';
import Raids from './components/Raids';
import LocationSearchModal from './components/LocationSearchModal';
import './App.css';

function App() {
  const [userLocation, setUserLocation] = useState([40.4406, -79.9959]); // Pittsburgh default
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const handleLocationChange = (newLocation) => {
    setUserLocation(newLocation);
  };
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="navbar-container">
            <Link to="/" className="navbar-logo">
              <span className="logo-icon">🔴</span> PokeFind
            </Link>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link to="/" className="nav-links">
                  🗺️ Map
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/raids" className="nav-links">
                  ⚔️ Raids
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/routes" className="nav-links">
                  🧭 Routes
                </Link>
              </li>
              <li className="nav-item location-search-item">
                <button 
                  className="location-search-btn"
                  onClick={() => setIsLocationModalOpen(true)}
                  title={`Current: ${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`}
                >
                  📍 Location: {userLocation[0].toFixed(2)}, {userLocation[1].toFixed(2)}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Route exact path="/" render={() => <Map userLocation={userLocation} onLocationChange={handleLocationChange} />} />
          <Route path="/routes" component={Routes} />
          <Route path="/raids" render={() => <Raids userLocation={userLocation} onLocationChange={handleLocationChange} />} />
        </main>

        <LocationSearchModal 
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onLocationChange={handleLocationChange}
          currentLocation={userLocation}
        />
      </div>
    </Router>
  );
}

export default App;
