const Raid = require('../models/raidModel');

// Get all raids
exports.getRaids = async (req, res) => {
    try {
        const raids = await Raid.find();
        res.json(raids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get nearby raids based on coordinates and radius
exports.getNearbyRaids = async (req, res) => {
    try {
        const { latitude, longitude, radius = 5 } = req.query; // radius in km
        
        if (!latitude || !longitude) {
            return res.status(400).json({ message: "Latitude and longitude are required" });
        }

        // Convert radius from km to degrees (approximately 1 degree = 111 km)
        const radiusInDegrees = radius / 111;

        const nearbyRaids = await Raid.find({
            latitude: {
                $gte: latitude - radiusInDegrees,
                $lte: latitude + radiusInDegrees,
            },
            longitude: {
                $gte: longitude - radiusInDegrees,
                $lte: longitude + radiusInDegrees,
            },
        });

        res.json(nearbyRaids);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new raid
exports.addRaid = async (req, res) => {
    const { gymName, bossName, latitude, longitude, raidLevel, startTime, endTime, participants } = req.body;

    try {
        if (!gymName || !bossName || !latitude || !longitude || !raidLevel || !startTime || !endTime) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const raid = new Raid({
            gymName,
            bossName,
            latitude,
            longitude,
            raidLevel,
            startTime,
            endTime,
            participants: participants || 0,
        });
        await raid.save();
        res.status(201).json(raid);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a raid
exports.updateRaid = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const raid = await Raid.findByIdAndUpdate(id, updates, { new: true });
        if (!raid) {
            return res.status(404).json({ message: "Raid not found" });
        }
        res.json(raid);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a raid
exports.deleteRaid = async (req, res) => {
    const { id } = req.params;

    try {
        const raid = await Raid.findByIdAndDelete(id);
        if (!raid) {
            return res.status(404).json({ message: "Raid not found" });
        }
        res.json({ message: "Raid deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
