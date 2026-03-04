require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Pokemon = require('./models/pokemonModels');

// Pittsburgh, PA coordinates
const PITTSBURGH_LAT = 40.4406;
const PITTSBURGH_LNG = -79.9959;

// Pokémon data: Rare and above only (Gen 1-3)
const pokemonList = [
  // Rare (Rarity: Rare)
  { id: 6, name: 'Charizard', rarity: 'Rare' },
  { id: 9, name: 'Blastoise', rarity: 'Rare' },
  { id: 94, name: 'Gengar', rarity: 'Rare' },
  { id: 131, name: 'Lapras', rarity: 'Rare' },
  { id: 143, name: 'Snorlax', rarity: 'Rare' },
  { id: 147, name: 'Dratini', rarity: 'Rare' },
  { id: 246, name: 'Larvitar', rarity: 'Rare' },
  { id: 280, name: 'Ralts', rarity: 'Rare' },
  { id: 287, name: 'Slakoth', rarity: 'Rare' },
  { id: 371, name: 'Bagon', rarity: 'Rare' },

  // Very Rare (Rarity: Very Rare)
  { id: 3, name: 'Venusaur', rarity: 'Very Rare' },
  { id: 130, name: 'Gyarados', rarity: 'Very Rare' },
  { id: 149, name: 'Dragonite', rarity: 'Very Rare' },
  { id: 248, name: 'Tyranitar', rarity: 'Very Rare' },
  { id: 384, name: 'Rayquaza', rarity: 'Very Rare' },

  // Legendary (Rarity: Legendary)
  { id: 144, name: 'Articuno', rarity: 'Legendary' },
  { id: 145, name: 'Zapdos', rarity: 'Legendary' },
  { id: 146, name: 'Moltres', rarity: 'Legendary' },
  { id: 150, name: 'Mewtwo', rarity: 'Legendary' },
  { id: 249, name: 'Lugia', rarity: 'Legendary' },
  { id: 250, name: 'Ho-Oh', rarity: 'Legendary' },
];

// Helper: Generate random coordinates within radius (km) of a center point
function randomCoordinates(centerLat, centerLng, radiusKm) {
  const radiusInDegrees = radiusKm / 111;
  const randomLat = centerLat + (Math.random() - 0.5) * 2 * radiusInDegrees;
  const randomLng = centerLng + (Math.random() - 0.5) * 2 * radiusInDegrees;
  return {
    latitude: parseFloat(randomLat.toFixed(6)),
    longitude: parseFloat(randomLng.toFixed(6)),
  };
}

// Helper: Generate random despawn time (between 10 min and 2 hours from now)
function randomDespawnTime() {
  const now = new Date();
  const minutes = Math.floor(Math.random() * 110) + 10; // 10-120 minutes
  return new Date(now.getTime() + minutes * 60000);
}

// Main seed function
async function seedPokemon() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing Pokémon data
    await Pokemon.deleteMany({});
    console.log('🗑️  Cleared existing Pokémon data');

    const pokemonSpawns = [];

    console.log('🔄 Fetching Pokémon data from PokéAPI...\n');

    // Create spawn for each Pokémon
    for (const pkmn of pokemonList) {
      try {
        // Fetch Pokémon data from PokéAPI
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pkmn.id}`);
        const pokeData = response.data;

        // Generate random coordinates around Pittsburgh
        const coords = randomCoordinates(PITTSBURGH_LAT, PITTSBURGH_LNG, 10); // 10km radius

        // Generate random IVs (0-15 each)
        const ivAttack = Math.floor(Math.random() * 16);
        const ivDefense = Math.floor(Math.random() * 16);
        const ivStamina = Math.floor(Math.random() * 16);
        const totalIV = ((ivAttack + ivDefense + ivStamina) / 45 * 100).toFixed(1);

        const spawn = {
          name: pokeData.name.charAt(0).toUpperCase() + pokeData.name.slice(1),
          pokedexId: pkmn.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          rarity: pkmn.rarity,
          iv_attack: ivAttack,
          iv_defense: ivDefense,
          iv_stamina: ivStamina,
          spawnTime: new Date(),
          despawnTime: randomDespawnTime(),
          accuracy: Math.floor(Math.random() * 20) + 80, // 80-100% accuracy
        };

        pokemonSpawns.push(spawn);
        console.log(`✓ ${spawn.name} (#${pkmn.id}) - ${pkmn.rarity} IV:${totalIV}% at (${coords.latitude}, ${coords.longitude})`);

        // Rate limit: Wait 100ms between API calls to be respectful to PokéAPI
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error fetching ${pkmn.name}:`, error.message);
      }
    }

    // Insert all spawns into database
    await Pokemon.insertMany(pokemonSpawns);
    console.log(`\n🎉 Successfully seeded ${pokemonSpawns.length} Rare+ Pokémon spawns around Pittsburgh, PA!`);

    // Display summary by rarity
    const summary = pokemonSpawns.reduce((acc, p) => {
      acc[p.rarity] = (acc[p.rarity] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Summary by Rarity:');
    Object.entries(summary).forEach(([rarity, count]) => {
      console.log(`   ${rarity}: ${count}`);
    });

    mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed script
seedPokemon();
