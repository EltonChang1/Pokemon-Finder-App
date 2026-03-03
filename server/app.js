const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const pokemonRoutes = require('./routes/pokemonRoutes');
const raidRoutes = require('./routes/raidRoutes');
const routeRoutes = require('./routes/routeRoutes');
const db = require('./config/db');

// Initialize the Express app
const app = express();

// Connect to MongoDB
db();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/pokemon-spawns', pokemonRoutes);
app.use('/api/raids', raidRoutes);
app.use('/api/routes', routeRoutes);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
