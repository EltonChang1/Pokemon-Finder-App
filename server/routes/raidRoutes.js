const express = require('express');
const router = express.Router();
const raidController = require('../controllers/raidController');

// Get all raids
router.get('/', raidController.getRaids);

// Get nearby raids
router.get('/nearby', raidController.getNearbyRaids);

// Add a new raid
router.post('/', raidController.addRaid);

// Update a raid
router.put('/:id', raidController.updateRaid);

// Delete a raid
router.delete('/:id', raidController.deleteRaid);

module.exports = router;
