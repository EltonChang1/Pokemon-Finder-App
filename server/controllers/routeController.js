const Route = require('../models/routeModel');

// Get all routes
exports.getRoutes = async (req, res) => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single route by ID
exports.getRouteById = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }
        res.json(route);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add a new route
exports.addRoute = async (req, res) => {
    const { name, gpxData, distance, duration, difficulty, createdBy } = req.body;

    try {
        if (!name || !gpxData) {
            return res.status(400).json({ message: "Name and GPX data are required" });
        }

        const route = new Route({
            name,
            gpxData,
            distance,
            duration,
            difficulty,
            createdBy,
        });
        await route.save();
        res.status(201).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update a route
exports.updateRoute = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const route = await Route.findByIdAndUpdate(id, updates, { new: true });
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }
        res.json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a route
exports.deleteRoute = async (req, res) => {
    const { id } = req.params;

    try {
        const route = await Route.findByIdAndDelete(id);
        if (!route) {
            return res.status(404).json({ message: "Route not found" });
        }
        res.json({ message: "Route deleted successfully" });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
