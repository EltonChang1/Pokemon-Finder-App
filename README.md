# PokeFind

**PokeFind** is a web application designed to enhance the Pokémon Go experience by providing real-time Pokémon radar, Gym and Raid information, and GPS route import/export features.

## 📖 User Guide

**New to PokeFind?** Check out our comprehensive [User Guide](USERGUIDE.md) with screenshots and step-by-step instructions!

**Or try the [Interactive User Guide](https://eltonchang1.github.io/userguide.html)** for a modern, animated walkthrough of all features!

## Features
- **Real-Time Pokémon Radar**: Displays nearby Pokémon spawns on an interactive map with customizable search radius.
- **Advanced Filtering System**: Filter Pokémon by name, rarity level, IV stats (Attack/Defense/Stamina), and accuracy. Filter raids by boss name, level, participants, and time remaining.
- **Location Search**: Search any location worldwide using address or GPS coordinates.
- **GPS Route Import/Export**: Upload and download GPX files for optimized Pokémon hunting routes.
- **Gym & Raid Battle Information**: Provides live updates on nearby Gym battles and Raid participation.
- **Detailed Pokémon Info**: View IV stats, spawn/despawn times, rarity levels, and accuracy ratings.
- **Interactive Maps**: Powered by Leaflet with smooth recentering and zoom controls.

## Tech Stack
### Frontend:
- **React.js**: For building the user interface and handling user interactions.
- **Leaflet.js**: For rendering interactive maps.
- **Axios**: For making API requests to the backend.

### Backend:
- **Node.js + Express**: Serves the backend API for handling Pokémon data, routes, and raids.
- **MongoDB**: Stores the data for Pokémon spawns, user routes, and raids.
- **Mongoose**: MongoDB object modeling tool to manage data.

## Installation

### Prerequisites:
- **Node.js** and **npm**: Make sure you have Node.js and npm installed.
- **MongoDB**: Either a local instance of MongoDB or a cloud-based service like MongoDB Atlas.

