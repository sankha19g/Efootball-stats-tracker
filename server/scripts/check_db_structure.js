const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function checkData() {
    try {
        console.log('Using Mongo URI:', process.env.MONGODB_URI ? 'URI found' : 'URI NOT FOUND');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ username: 'admin' });
        if (!user) {
            console.log('❌ User admin not found');
            process.exit(0);
        }

        console.log(`✅ Found user admin with ${user.players.length} players`);

        const nonePlayers = user.players.filter(p => !p.playstyle || p.playstyle === 'None');
        console.log(`📊 Players with "None" playstyle: ${nonePlayers.length}`);

        if (nonePlayers.length > 0) {
            console.log('Sample "None" player structure:');
            console.log(JSON.stringify(nonePlayers[0], null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkData();
