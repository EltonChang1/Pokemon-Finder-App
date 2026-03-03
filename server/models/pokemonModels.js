const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    pokedexId: {
        type: Number,
        required: false,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    rarity: {
        type: String,
        required: true,
        enum: ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'],
    },
    spawnTime: {
        type: Date,
        default: Date.now,
    },
    despawnTime: {
        type: Date,
        required: false,
    },
    accuracy: {
        type: Number,
        default: 100, // Confidence percentage
    },
}, { timestamps: true });

const Pokemon = mongoose.model('Pokemon', pokemonSchema);
module.exports = Pokemon;
