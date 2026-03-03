# PokeFind Setup & API Guide

## Overview
PokeFind is a web application designed to enhance the Pokémon Go experience by providing:
- **Real-Time Pokémon Radar**: Displays nearby Pokémon spawns on an interactive map
- **Gym & Raid Battle Information**: Provides real-time raid information and gym battles
- **GPS Route Import/Export**: Upload and manage GPX files for optimized hunting routes

---

## 📋 Required External APIs

### 1. **PokéAPI** (Free - No Auth Required)
- **URL**: https://pokeapi.co/
- **Purpose**: Get Pokémon data (sprites, types, stats, evolutions)
- **Usage**: Used for Pokémon identification and display
- **Example Endpoint**: 
  ```
  GET https://pokeapi.co/api/v2/pokemon/1
  ```

### 2. **Browser Geolocation API** (Built-in)
- **Purpose**: Get user's real-time GPS location
- **Usage**: Automatically captures user's latitude/longitude
- **Note**: Requires HTTPS in production or user permission in development

### 3. **Pokémon GO Data Sources** (Choose one)

#### Option A: Manual Data Entry
- Add Pokémon/Raids directly through your backend API
- Best for testing and controlled environments

#### Option B: Third-Party Services
- **Pterodactyl Map**: Real-time raid/spawn data
- **PokeAlert**: Community-driven spawn reporting
- **TileMill**: Custom tile layers for maps

#### Option C: Community Data
- Build internal reporting system for users to submit sightings

---

## 🗂️ Project Structure

```
Pokemon-Finder-App/
├── server/                    # Backend (Node.js + Express)
│   ├── app.js               # Main server file
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── models/
│   │   ├── pokemonModels.js # Pokémon data schema
│   │   ├── raidModel.js     # Raid data schema
│   │   └── routeModel.js    # Route data schema
│   ├── controllers/         # Business logic
│   ├── routes/              # API endpoints
│   └── package.json
│
├── client/                    # Frontend (React)
│   ├── src/
│   │   ├── App.js           # Main app component with routing
│   │   ├── api.js           # API utility functions
│   │   ├── components/
│   │   │   ├── Map.js       # Pokémon radar map
│   │   │   ├── Raids.js     # Raid battles map
│   │   │   └── Routes.js    # GPS route manager
│   │   └── index.js
│   └── package.json
│
├── .env                       # Environment variables
├── .env.example             # Template for .env
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v14+
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Modern web browser** with HTTPS support (for production geolocation)

---

## 🚀 Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd client
npm install
```

### 2. Configure MongoDB

Create `.env` file in the root directory:
```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/pokefind
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pokefind

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
mongod
```

**Or use MongoDB Atlas** (cloud):
- Create account at https://www.mongodb.com/cloud/atlas
- Create a cluster and get connection string
- Update `MONGO_URI` in `.env`

### 4. Start the Application

**Start Backend** (Terminal 1):
```bash
cd server
npm run dev
```
Backend runs on `http://localhost:5000`

**Start Frontend** (Terminal 2):
```bash
cd client
npm start
```
Frontend runs on `http://localhost:3000`

---

## 🔌 Backend API Endpoints

### Pokémon Spawns

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/pokemon-spawns` | Get all Pokémon spawns |
| `GET` | `/api/pokemon-spawns/nearby` | Get nearby Pokémon (requires lat, lon, radius params) |
| `POST` | `/api/pokemon-spawns` | Add new Pokémon spawn |
| `PUT` | `/api/pokemon-spawns/:id` | Update Pokémon spawn |
| `DELETE` | `/api/pokemon-spawns/:id` | Delete Pokémon spawn |

**Example: Add Pokémon Spawn**
```bash
curl -X POST http://localhost:5000/api/pokemon-spawns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pikachu",
    "pokedexId": 25,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "rarity": "Uncommon",
    "despawnTime": "2026-03-03T15:30:00Z"
  }'
```

**Example: Get Nearby Pokémon**
```bash
curl "http://localhost:5000/api/pokemon-spawns/nearby?latitude=40.7128&longitude=-74.0060&radius=5"
```

### Raids

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/raids` | Get all raids |
| `GET` | `/api/raids/nearby` | Get nearby raids (requires lat, lon, radius params) |
| `POST` | `/api/raids` | Add new raid |
| `PUT` | `/api/raids/:id` | Update raid |
| `DELETE` | `/api/raids/:id` | Delete raid |

**Example: Add Raid**
```bash
curl -X POST http://localhost:5000/api/raids \
  -H "Content-Type: application/json" \
  -d '{
    "gymName": "Central Park Gym",
    "bossName": "Articuno",
    "latitude": 40.7829,
    "longitude": -73.9654,
    "raidLevel": 5,
    "startTime": "2026-03-03T14:00:00Z",
    "endTime": "2026-03-03T14:45:00Z",
    "participants": 8
  }'
```

### Routes (GPX Files)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/routes` | Get all routes |
| `GET` | `/api/routes/:id` | Get single route |
| `POST` | `/api/routes` | Add new route |
| `PUT` | `/api/routes/:id` | Update route |
| `DELETE` | `/api/routes/:id` | Delete route |

**Example: Add Route**
```bash
curl -X POST http://localhost:5000/api/routes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Central Park Hunt",
    "gpxData": "<gpx>...</gpx>",
    "distance": 5.2,
    "difficulty": "Medium"
  }'
```

---

## 🎯 Data Models

### Pokémon Spawn
```javascript
{
  _id: ObjectId,
  name: String,          // e.g., "Pikachu"
  pokedexId: Number,     // e.g., 25
  latitude: Number,      // GPS coordinate
  longitude: Number,     // GPS coordinate
  rarity: String,        // Common, Uncommon, Rare, Very Rare, Legendary
  spawnTime: Date,       // When Pokémon appeared
  despawnTime: Date,     // When Pokémon will disappear
  accuracy: Number,      // Confidence percentage (0-100)
  createdAt: Date,
  updatedAt: Date
}
```

### Raid
```javascript
{
  _id: ObjectId,
  gymName: String,       // e.g., "Central Park Gym"
  bossName: String,      // e.g., "Mewtwo"
  latitude: Number,      // GPS coordinate
  longitude: Number,     // GPS coordinate
  raidLevel: Number,     // 1-5
  startTime: Date,       // Raid start time
  endTime: Date,         // Raid end time
  participants: Number,  // How many people joined
  createdAt: Date,
  updatedAt: Date
}
```

### Route
```javascript
{
  _id: ObjectId,
  name: String,          // e.g., "Central Park Hunt"
  gpxData: String,       // Raw GPX file content
  distance: Number,      // Distance in km
  duration: Number,      // Duration in minutes
  difficulty: String,    // Easy, Medium, Hard
  createdBy: String,     // Username/ID
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Testing with Sample Data

### Add Test Pokémon
```bash
curl -X POST http://localhost:5000/api/pokemon-spawns \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Charmander",
      "pokedexId": 4,
      "latitude": 40.7580,
      "longitude": -73.9855,
      "rarity": "Uncommon"
    },
    {
      "name": "Squirtle",
      "pokedexId": 7,
      "latitude": 40.7614,
      "longitude": -73.9776,
      "rarity": "Rare"
    }
  ]'
```

### Test Geolocation
Open browser DevTools (F12) → Console:
```javascript
navigator.geolocation.getCurrentPosition(pos => {
  console.log(pos.coords.latitude, pos.coords.longitude);
});
```

---

## 🔒 Important Notes

### Geolocation Requirements
- **Development**: Works on `localhost` without HTTPS
- **Production**: Requires HTTPS or will fail
- **User Permission**: Users must grant location access to the browser

### Data Privacy
- Store minimal user data
- Implement rate limiting for API endpoints
- Validate all user inputs on the backend

### API Rate Limiting (Recommended)
```javascript
// In production, add rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running (`mongod`)

### CORS Error in Frontend
```
Access-Control-Allow-Origin error
```
**Solution**: Backend already has CORS enabled. Check if backend is running on port 5000

### Geolocation Not Working
- Check HTTPS requirement (production)
- Grant location permission in browser
- Check browser console for errors

### API Endpoints Return 404
- Ensure backend is running on port 5000
- Check `.env` file has correct MongoDB URI
- Verify route definitions in `/server/routes/`

---

## 📚 Frontend Features

### Map Component
- Shows user's real-time location
- Displays nearby Pokémon within selected radius
- Search radius slider (1-20 km)
- Rarity color coding

### Raids Component
- Shows nearby raids
- Displays raid level and time remaining
- Participant count
- Real-time countdown timer

### Routes Component
- Upload GPX files
- Save routes to database
- Load saved routes
- Calculate route distance
- Display route difficulty

---

## 🔄 Next Steps to Make It Production-Ready

1. **Add Authentication**: Implement user login/signup
2. **Add Real Pokémon GO Data**: Integrate with data providers
3. **Implement Notifications**: Alert users about rare spawns
4. **Add User Profiles**: Track favorite Pokémon, statistics
5. **Improve Map UI**: Custom markers, better styling
6. **Add Filtering**: Filter by Pokémon type, rarity
7. **Implement Search**: Search for specific Pokémon
8. **Add Social Features**: Join raids, share routes
9. **Deploy**: Use Docker, AWS, or Heroku for hosting
10. **Add Testing**: Jest, Mocha for unit tests

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Check server console for logs
3. Verify `.env` configuration
4. Ensure MongoDB is running
5. Check API responses in Network tab (DevTools)

---

## 📝 License

This project is open source. See LICENSE file for details.
