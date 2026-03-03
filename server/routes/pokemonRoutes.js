const express = require('express');
const router = express.Router();
const pokemonController = require('../controllers/pokemonController');

// Get all Pokémon spawns
router.get('/', pokemonController.getPokemonSpawns);

// Get nearby Pokémon spawns
router.get('/nearby', pokemonController.getNearbyPokemon);

// Add a new Pokémon spawn
router.post('/', pokemonController.addPokemonSpawn);

// Update a Pokémon spawn
router.put('/:id', pokemonController.updatePokemonSpawn);

// Delete a Pokémon spawn
router.delete('/:id', pokemonController.deletePokemonSpawn);

module.exports = router;
