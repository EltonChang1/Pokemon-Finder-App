const express = require('express');
const { search } = require('../controllers/geocodeController');

const router = express.Router();

router.get('/', ...search);

module.exports = router;
