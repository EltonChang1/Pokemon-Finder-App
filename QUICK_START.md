# ⚡ Quick Start Guide - PokeFind

Get your PokeFind app running in 5 minutes!

---

## Step 1: Install Dependencies

### Backend
```bash
cd server
npm install
```

### Frontend
```bash
cd client
npm install
```

---

## Step 2: Setup MongoDB

### Option A: Local MongoDB (Easiest for Testing)

**macOS:**
```bash
# Install MongoDB via Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**Check if it's running:**
```bash
mongo
# If you see: >
# Then MongoDB is running. Type: exit
```

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string from "Connect" button
5. Update `.env` file with connection string

---

## Step 3: Configure .env File

Create `.env` in the root directory:

```env
MONGO_URI=mongodb://localhost:27017/pokefind
PORT=5000
NODE_ENV=development
```

---

## Step 4: Start the Application

### Terminal 1 - Start Backend
```bash
cd server
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB Connected
```

### Terminal 2 - Start Frontend
```bash
cd client
npm start
```

Expected output:
```
webpack compiled successfully
On Your Network: http://192.168.x.x:3000
Compiled successfully!
```

Browser should open automatically to `http://localhost:3000`

---

## Step 5: Add Test Data

### Option A: Using API (Recommended)

**Add test Pokémon:**
```bash
curl -X POST http://localhost:5000/api/pokemon-spawns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pikachu",
    "pokedexId": 25,
    "latitude": 40.7128,
    "longitude": -74.0060,
    "rarity": "Uncommon"
  }'
```

**Add test Raid:**
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

### Option B: Using MongoDB Directly

1. Install MongoDB Compass (GUI): https://www.mongodb.com/products/compass
2. Connect to `mongodb://localhost:27017`
3. Create database: `pokefind`
4. Create collections: `pokemons`, `raids`, `routes`
5. Insert sample documents

---

## 🗺️ Using the App

### Map Page (Pokémon Radar)
1. Click "🗺️ Map" nav
2. Browser will ask for location permission - **Allow it**
3. Adjust search radius with slider
4. See Pokémon nearby (after adding test data)
5. Click markers for details

### Raids Page
1. Click "⚔️ Raids" nav
2. Browser will ask for location permission - **Allow it**
3. Adjust search radius
4. See raids nearby
5. View raid level, time remaining, participants

### Routes Page
1. Click "🧭 Routes" nav
2. Click file input to upload a GPX file
3. Enter route name
4. Click "💾 Save Route"
5. Route appears on map and in saved routes list

---

## 🧪 Quick Test GPX File

Create a file called `test_route.gpx`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>
      <trkpt lat="40.7128" lon="-74.0060"/>
      <trkpt lat="40.7129" lon="-74.0061"/>
      <trkpt lat="40.7130" lon="-74.0062"/>
      <trkpt lat="40.7131" lon="-74.0063"/>
    </trkseg>
  </trk>
</gpx>
```

Then upload it in the Routes page.

---

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Can access map page with location permission granted
- [ ] Test Pokémon appears on map
- [ ] Test Raid appears on Raids page
- [ ] Can upload GPX file to Routes

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection error | Run `brew services start mongodb-community` |
| Port 5000 in use | Change PORT in .env or kill process on port 5000 |
| Frontend can't reach backend | Ensure backend is running, check proxy in package.json |
| Map is blank | Grant location permission, add test data |
| npm install fails | Delete node_modules and package-lock.json, run again |

---

## 📚 API Documentation

Full API documentation available in: **SETUP_AND_API_GUIDE.md**

---

## 🚀 Next Steps

1. Read **SETUP_AND_API_GUIDE.md** for detailed API endpoints
2. Modify test data to your location
3. Integrate real Pokémon GO data
4. Add authentication
5. Deploy to production

---

## 📝 Notes

- **Geolocation**: Works best with HTTPS in production
- **Data**: All data stored in MongoDB
- **API Base**: Backend API at `http://localhost:5000`
- **Frontend**: React with Leaflet maps

Enjoy! 🎮
