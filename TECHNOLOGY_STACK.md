# 🛠️ Technology Stack - Detailed Breakdown

## Frontend Stack

### React (^17.0.2)
- **Purpose**: JavaScript library for building interactive user interfaces
- **Usage**: Component-based UI development
- **Key Components**:
  - `App.js`: Main app with routing
  - `Map.js`: Pokémon radar map display
  - `Raids.js`: Raid battles map display
  - `Routes.js`: GPS route management
- **Why**: Fast, reactive updates and component reusability

### React Router DOM (^5.2.0)
- **Purpose**: Client-side routing without page reloads
- **Usage**: Navigate between Map, Raids, and Routes pages
- **Key Features**:
  - `<Router>`: Wraps the app
  - `<Route>`: Maps paths to components
  - `<Link>`: Navigation without page refresh

### Leaflet (^1.7.1)
- **Purpose**: Open-source JavaScript library for interactive maps
- **Usage**: Display maps with markers, popups, and polylines
- **Key Features**:
  - `MapContainer`: Map viewport
  - `TileLayer`: OpenStreetMap tiles
  - `Marker`: Location points
  - `Popup`: Marker information
  - `Circle`: Radius visualization
  - `Polyline`: Route lines

### React Leaflet (^3.1.0)
- **Purpose**: React components for Leaflet
- **Usage**: Integrate Leaflet with React
- **Key Features**:
  - React wrapper for Leaflet
  - Declarative map rendering
  - Easy component integration

### Axios (^0.21.1)
- **Purpose**: HTTP client for API requests
- **Usage**: Communicate with backend server
- **Key Features**:
  - Promise-based API
  - Interceptors for error handling
  - Request/response transformation

---

## Backend Stack

### Node.js & Express (^4.17.1)
- **Purpose**: JavaScript runtime and web framework
- **Usage**: RESTful API server
- **Key Features**:
  - `app.use()`: Middleware setup
  - `app.get/post/put/delete()`: Route handlers
  - CORS: Cross-origin requests
  - JSON parsing: `express.json()`

### MongoDB (Latest)
- **Purpose**: NoSQL document database
- **Usage**: Store Pokémon spawns, raids, and routes
- **Key Features**:
  - Flexible schema (no migrations needed)
  - JSON-like document structure
  - Geospatial queries support
  - Built-in indexing

### Mongoose (^5.10.9)
- **Purpose**: MongoDB object modeling tool
- **Usage**: Define schemas and interact with MongoDB
- **Key Features**:
  - Schema validation
  - Type casting
  - Query building
  - Middleware (hooks)

### CORS (^2.8.5)
- **Purpose**: Enable cross-origin requests
- **Usage**: Allow frontend (localhost:3000) to call backend (localhost:5000)
- **Configuration**:
  ```javascript
  app.use(cors()); // Allows requests from any origin
  ```

### Dotenv (^10.0.0)
- **Purpose**: Load environment variables from `.env` file
- **Usage**: Manage sensitive configuration (MongoDB URI, ports)
- **Usage**:
  ```javascript
  require('dotenv').config();
  const mongoUri = process.env.MONGO_URI;
  ```

### Nodemon (Dev Dependency, ^2.0.12)
- **Purpose**: Auto-restart server on file changes
- **Usage**: Faster development workflow
- **Usage**: `npm run dev`

---

## Browser APIs Used

### Geolocation API
- **Purpose**: Get user's GPS coordinates
- **Usage**: Center map on user location
- **Code**:
  ```javascript
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
  });
  ```

### File Reader API
- **Purpose**: Read uploaded GPX files
- **Usage**: Parse GPS route data
- **Code**:
  ```javascript
  reader.readAsText(file);
  ```

### DOM Parser API
- **Purpose**: Parse XML (GPX format)
- **Usage**: Extract coordinates from GPX files
- **Code**:
  ```javascript
  const xmlDoc = parser.parseFromString(gpxString, 'text/xml');
  ```

---

## Third-Party Services

### OpenStreetMap (Free)
- **Purpose**: Provides map tiles
- **URL**: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Attribution Required**: Yes (included in Leaflet)
- **Cost**: Free (powered by volunteers)

### PokéAPI (Optional)
- **Purpose**: Pokémon data (types, stats, sprites)
- **URL**: https://pokeapi.co/
- **Authentication**: None required
- **Cost**: Free
- **Use Case**: Future integration for Pokémon information

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Components                        │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Geolocation API → Get User Location         │   │   │
│  │  │ useState() → Manage state                   │   │   │
│  │  │ useEffect() → Fetch from backend on mount  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                    ↓                                  │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ Axios → HTTP requests to backend API        │   │   │
│  │  │ Leaflet → Render maps and markers           │   │   │
│  │  │ React Router → Handle navigation            │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                  Node.js Backend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Express Server (Port 5000)                  │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ CORS Middleware → Allow cross-origin calls  │   │   │
│  │  │ JSON Parser → Parse request bodies          │   │   │
│  │  │ Routes → /api/pokemon-spawns, /raids, /routes│  │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                    ↓                                  │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │         Controllers (Business Logic)        │   │   │
│  │  │ getPokemonSpawns, getRaids, getRoutes      │   │   │
│  │  │ getNearby (Geolocation filtering)          │   │   │
│  │  │ addXxx, updateXxx, deleteXxx (CRUD)        │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                    ↓                                  │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │      Mongoose Models & Validation           │   │   │
│  │  │ pokemonModels.js, raidModel.js, routeModel │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓ Queries
┌─────────────────────────────────────────────────────────────┐
│                 MongoDB Database                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Collections:                                         │   │
│  │ • pokemons (spawn locations)                        │   │
│  │ • raids (gym battles)                               │   │
│  │ • routes (GPS tracks)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Request/Response Example

### Example: Get Nearby Pokémon

**Frontend (React)**
```javascript
// In Map.js component
useEffect(() => {
  pokemonAPI.getNearby(40.7128, -74.0060, 5)
    .then(response => setPokemonSpawns(response.data))
    .catch(error => console.error(error));
}, [userLocation, searchRadius]);
```

**HTTP Request**
```
GET /api/pokemon-spawns/nearby?latitude=40.7128&longitude=-74.0060&radius=5
Host: localhost:5000
```

**Backend (Express)**
```javascript
// In pokemonController.js
exports.getNearbyPokemon = async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  
  // Calculate degrees from radius
  const radiusInDegrees = radius / 111;
  
  // Query MongoDB using Mongoose
  const nearbyPokemon = await Pokemon.find({
    latitude: { $gte: lat - rad, $lte: lat + rad },
    longitude: { $gte: lon - rad, $lte: lon + rad }
  });
  
  // Send response back to frontend
  res.json(nearbyPokemon);
};
```

**MongoDB Query**
```javascript
db.pokemons.find({
  latitude: { $gte: 40.707, $lte: 40.718 },
  longitude: { $gte: -74.011, $lte: -74.001 }
})
```

**HTTP Response**
```json
[
  {
    "_id": "...",
    "name": "Pikachu",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "rarity": "Uncommon",
    "spawnTime": "2026-03-03T12:30:00Z",
    ...
  }
]
```

**Frontend Display**
```javascript
// Render markers on Leaflet map
pokemonSpawns.map(pokemon => (
  <Marker position={[pokemon.latitude, pokemon.longitude]}>
    <Popup>{pokemon.name}</Popup>
  </Marker>
))
```

---

## Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/pokefind
# For MongoDB Atlas:
# MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/pokefind

# Server
PORT=5000
NODE_ENV=development
```

---

## Dependency Versions

### Frontend (package.json)
```json
{
  "react": "^17.0.2",           // UI library
  "react-dom": "^17.0.2",        // DOM rendering
  "react-router-dom": "^5.2.0",  // Client routing
  "leaflet": "^1.7.1",           // Maps
  "react-leaflet": "^3.1.0",     // React + Leaflet
  "axios": "^0.21.1"             // HTTP client
}
```

### Backend (package.json)
```json
{
  "express": "^4.17.1",          // Web framework
  "mongoose": "^5.10.9",         // MongoDB ODM
  "cors": "^2.8.5",              // CORS middleware
  "dotenv": "^10.0.0",           // Environment vars
  "nodemon": "^2.0.12"           // Dev auto-reload
}
```

---

## How Updates Flow Through the App

### 1. **User Action**
   User grants geolocation permission or slides search radius

### 2. **State Update** (React)
   ```javascript
   setUserLocation([lat, lon]) // or setSearchRadius(newRadius)
   ```

### 3. **Trigger Effect** (useEffect)
   Component dependency array includes `userLocation` or `searchRadius`

### 4. **API Call** (Axios)
   ```javascript
   await pokemonAPI.getNearby(lat, lon, radius)
   ```

### 5. **HTTP Request**
   Browser sends GET request to backend

### 6. **Backend Processing** (Express)
   ```
   1. Parse query parameters
   2. Validate input
   3. Convert radius to degrees
   4. Query MongoDB with geospatial filters
   5. Return filtered results
   ```

### 7. **Response** (JSON)
   Array of nearby Pokémon/Raids

### 8. **State Update** (React)
   ```javascript
   setPokemonSpawns(response.data)
   ```

### 9. **Re-render** (React)
   Component renders new markers on map

### 10. **User Sees Update**
   Map displays Pokémon at new locations

---

## Performance Considerations

### Frontend Optimization
- React.memo() for expensive components
- useCallback() for event handlers
- Lazy loading with React.lazy()

### Backend Optimization
- MongoDB indexes on latitude/longitude
- Limit query results
- Pagination for large datasets

### Network Optimization
- Gzip compression
- Minimize API calls
- Cache responses when possible

---

## Error Handling Strategy

```javascript
// Frontend
try {
  const response = await api.getNearby(...);
  setData(response.data);
} catch (error) {
  setError(error.message);
  console.error(error);
}

// Backend
try {
  // Business logic
} catch (error) {
  res.status(400).json({ message: error.message });
}
```

---

## Security Best Practices Implemented

1. ✅ **Input Validation**: Check lat/lon/radius parameters
2. ✅ **CORS**: Restrict origins in production
3. ✅ **Environment Variables**: Don't hardcode secrets
4. ✅ **Error Messages**: Don't expose internal details
5. ✅ **Geolocation**: Only use with HTTPS

---

## Future Technology Additions

| Feature | Technology |
|---------|-----------|
| Real-time updates | Socket.io, GraphQL subscriptions |
| Authentication | JWT, OAuth, Auth0 |
| Mobile app | React Native, Flutter |
| Server-side rendering | Next.js |
| Data visualization | D3.js, Chart.js |
| Push notifications | Firebase Cloud Messaging |
| Caching | Redis |
| CDN | Cloudflare, AWS CloudFront |
| Hosting | AWS EC2, Heroku, DigitalOcean |
| CI/CD | GitHub Actions, GitLab CI |

---

## Summary

PokeFind uses a modern **MERN** stack (MongoDB, Express, React, Node.js) with:
- **Frontend**: React with Leaflet for maps and geolocation
- **Backend**: Express with MongoDB for data persistence
- **Communication**: Axios for HTTP requests
- **Maps**: OpenStreetMap tiles via Leaflet
- **Database**: MongoDB for flexible document storage

All components are integrated and ready for production enhancement! 🚀
