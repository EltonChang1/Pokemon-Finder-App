const mongoose = require('mongoose');

const raidSchema = new mongoose.Schema({
    gymName: {
        type: String,
        required: true,
    },
    bossName: {
        type: String,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
    longitude: {
        type: Number,
        required: true,
    },
    raidLevel: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    participants: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

const Raid = mongoose.model('Raid', raidSchema);
module.exports = Raid;
