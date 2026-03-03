const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');

// Get all routes
router.get('/', routeController.getRoutes);

// Get a single route by ID
router.get('/:id', routeController.getRouteById);

// Add a new route
router.post('/', routeController.addRoute);

// Update a route
router.put('/:id', routeController.updateRoute);

// Delete a route
router.delete('/:id', routeController.deleteRoute);

module.exports = router;
