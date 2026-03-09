const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    club: String,
    league: String,
    nationality: String,
    age: Number,
    position: { type: String, required: true },
    secondaryPosition: String,
    playstyle: String,
    rating: { type: Number, required: true },
    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    matches: { type: Number, default: 0 },
    cardType: { type: String, default: 'Normal' },
    strongFoot: String,
    image: String,
    logos: {
        club: String,
        league: String,
        country: String
    },
    savedProgressions: [{
        rating: Number,
        goals: Number,
        assists: Number,
        matches: Number,
        savedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, default: 'admin' },
    passwordHash: { type: String, required: true },
    players: [playerSchema]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
