const Pokemon = require('../models/pokemonModels');

// Get all Pokémon spawns
exports.getPokemonSpawns = async (req, res) => {
    try {
        const pokemon = await Pokemon.find();
        res.json(pokemon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get nearby Pokémon spawns based on coordinates and radius
exports.getNearbyPokemon = async (req, res) => {
    try {
        const { latitude, longitude, radius = 5 } = req.query; // radius in km
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and longitude are required" });
        }

        const latitudeNum = parseFloat(latitude);
        const longitudeNum = parseFloat(longitude);
        const radiusNum = parseFloat(radius);

        if (Number.isNaN(latitudeNum) || Number.isNaN(longitudeNum) || Number.isNaN(radiusNum)) {
            return res.status(400).json({ message: "Latitude, longitude, and radius must be valid numbers" });
        }

        // Convert radius from km to degrees (approximately 1 degree = 111 km)
        const radiusInDegrees = radiusNum / 111;

        const nearbyPokemon = await Pokemon.find({
            latitude: {
                $gte: latitudeNum - radiusInDegrees,
                $lte: latitudeNum + radiusInDegrees,
            },
            longitude: {
                $gte: longitudeNum - radiusInDegrees,
                $lte: longitudeNum + radiusInDegrees,
            },
        });

        res.json(nearbyPokemon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new Pokémon spawn
exports.addPokemonSpawn = async (req, res) => {
    const { name, pokedexId, latitude, longitude, rarity, despawnTime } = req.body;

    try {
        if (!name || !latitude || !longitude || !rarity) {
            return res.status(400).json({ message: "Missing required fields: name, latitude, longitude, rarity" });
        }

        const pokemon = new Pokemon({
            name,
            pokedexId,
            latitude,
            longitude,
            rarity,
            despawnTime,
        });
        await pokemon.save();
        res.status(201).json(pokemon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a Pokémon spawn
exports.updatePokemonSpawn = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const pokemon = await Pokemon.findByIdAndUpdate(id, updates, { new: true });
        if (!pokemon) {
            return res.status(404).json({ message: "Pokémon not found" });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a Pokémon spawn
exports.deletePokemonSpawn = async (req, res) => {
    const { id } = req.params;

    try {
        const pokemon = await Pokemon.findByIdAndDelete(id);
        if (!pokemon) {
            return res.status(404).json({ message: "Pokémon not found" });
        }
        res.json({ message: "Pokémon deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
