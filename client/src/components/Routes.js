import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { routeAPI } from '../api';
import './Routes.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function Routes() {
  const [routes, setRoutes] = useState([]);
  const [gpxCoordinates, setGpxCoordinates] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapCenter, setMapCenter] = useState([51.505, -0.09]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeName, setRouteName] = useState('');

  // Fetch saved routes
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

  // Parse GPX file
  const parseGPX = (gpxString) => {
    try {
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
        if (!isNaN(lat) && !isNaN(lon)) {
          coordinates.push([lat, lon]);
        }
      }

      if (coordinates.length === 0) {
        throw new Error('No coordinates found in GPX file');
      }

      return coordinates;
    } catch (err) {
      console.error('Error parsing GPX:', err);
      throw new Error('Failed to parse GPX file: ' + err.message);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const coordinates = parseGPX(e.target.result);
        setGpxCoordinates(coordinates);

        // Center map on first coordinate
        if (coordinates.length > 0) {
          setMapCenter(coordinates[0]);
        }

        setError(null);
      } catch (err) {
        setError(err.message);
        setGpxCoordinates([]);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  // Save route to database
  const handleSaveRoute = async () => {
    if (!routeName.trim()) {
      setError('Please enter a route name');
      return;
    }

    if (gpxCoordinates.length === 0) {
      setError('Please upload a GPX file first');
      return;
    }

    try {
      const gpxContent = (document.querySelector('input[type="file"]').files[0]);
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          // Calculate distance (simple approximation)
          let distance = 0;
          for (let i = 1; i < gpxCoordinates.length; i++) {
            const lat1 = gpxCoordinates[i - 1][0];
            const lon1 = gpxCoordinates[i - 1][1];
            const lat2 = gpxCoordinates[i][0];
            const lon2 = gpxCoordinates[i][1];

            const R = 6371; // Earth's radius in km
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
          setRoutes([...routes, response.data]);
          setRouteName('');
          setGpxCoordinates([]);
          document.querySelector('input[type="file"]').value = '';
          setError(null);
        } catch (err) {
          setError('Failed to save route: ' + err.message);
        }
      };

      reader.readAsText(document.querySelector('input[type="file"]').files[0]);
    } catch (err) {
      setError('Failed to save route: ' + err.message);
    }
  };

  // Load saved route
  const loadSavedRoute = (route) => {
    try {
      const coordinates = parseGPX(route.gpxData);
      setGpxCoordinates(coordinates);
      setSelectedRoute(route);

      if (coordinates.length > 0) {
        setMapCenter(coordinates[0]);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load route: ' + err.message);
    }
  };

  return (
    <div className="routes-page">
      <div className="routes-sidebar">
        <h2>🧭 GPS Routes</h2>

        <div className="upload-section">
          <h3>Upload New Route</h3>
          <div className="upload-group">
            <input
              type="file"
              accept=".gpx"
              onChange={handleFileUpload}
              disabled={loading}
            />
            <div className="route-name-input">
              <input
                type="text"
                placeholder="Enter route name"
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
              />
              <button onClick={handleSaveRoute} disabled={loading || gpxCoordinates.length === 0}>
                💾 Save Route
              </button>
            </div>
          </div>
          {gpxCoordinates.length > 0 && (
            <p className="success">✅ {gpxCoordinates.length} waypoints loaded</p>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="saved-routes">
          <h3>Saved Routes</h3>
          {loading && <p className="loading">Loading routes...</p>}
          {routes.length === 0 && !loading && <p className="no-routes">No saved routes yet</p>}

          <ul className="routes-list">
            {routes.map((route) => (
              <li
                key={route._id}
                className={`route-item ${selectedRoute?._id === route._id ? 'active' : ''}`}
                onClick={() => loadSavedRoute(route)}
              >
                <div className="route-info">
                  <strong>{route.name}</strong>
                  <span className="route-distance">{route.distance || '?'} km</span>
                  <span className="route-difficulty">{route.difficulty || 'Unknown'}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="routes-map">
        {gpxCoordinates.length > 0 ? (
          <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Route polyline */}
            <Polyline positions={gpxCoordinates} color="blue" weight={3} />

            {/* Start marker */}
            <Marker position={gpxCoordinates[0]}>
              <Popup>
                <div className="popup">
                  <h4>🟢 Start</h4>
                  <p>Lat: {gpxCoordinates[0][0].toFixed(6)}</p>
                  <p>Lon: {gpxCoordinates[0][1].toFixed(6)}</p>
                </div>
              </Popup>
            </Marker>

            {/* End marker */}
            {gpxCoordinates.length > 1 && (
              <Marker position={gpxCoordinates[gpxCoordinates.length - 1]}>
                <Popup>
                  <div className="popup">
                    <h4>🔴 End</h4>
                    <p>Lat: {gpxCoordinates[gpxCoordinates.length - 1][0].toFixed(6)}</p>
                    <p>Lon: {gpxCoordinates[gpxCoordinates.length - 1][1].toFixed(6)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="empty-map">
            <p>📁 Upload a GPX file to see the route on the map</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Routes;
