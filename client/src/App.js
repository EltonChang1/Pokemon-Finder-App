import React from 'react';
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import Map from './components/Map';
import Routes from './components/Routes';
import Raids from './components/Raids';
import './App.css';

function App() {
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
            </ul>
          </div>
        </nav>

        <main className="main-content">
          <Route exact path="/" component={Map} />
          <Route path="/routes" component={Routes} />
          <Route path="/raids" component={Raids} />
        </main>
      </div>
    </Router>
  );
}

export default App;
