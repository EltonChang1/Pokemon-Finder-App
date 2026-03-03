const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    gpxData: {
        type: String, // Store GPX file data as a string
        required: true,
    },
    distance: {
        type: Number,
        required: false, // Distance in kilometers
    },
    duration: {
        type: Number,
        required: false, // Duration in minutes
    },
    difficulty: {
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        default: 'Medium',
    },
    createdBy: {
        type: String,
        required: false,
    },
}, { timestamps: true });

const Route = mongoose.model('Route', routeSchema);
module.exports = Route;
