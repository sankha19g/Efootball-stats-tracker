const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

async function fixPlaystyles() {
    try {
        console.log('Loading pesdb_players.json...');
        const playersPath = path.join(__dirname, '../data', 'pesdb_players.json');
        const pesdbPlayers = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
        console.log(`✅ Loaded ${pesdbPlayers.length} players from reference file`);

        const lookup = new Map();
        pesdbPlayers.forEach(p => {
            const key = `${p.name.toLowerCase()}|${p.position}|${(p.club_original || p.club || '').toLowerCase()}`;
            if (!lookup.has(key)) lookup.set(key, p.playstyle);
        });

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 20000
        });
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ username: 'admin' });
        if (!user) {
            console.error('❌ User admin not found');
            process.exit(1);
        }

        let updatedCount = 0;
        user.players.forEach(player => {
            if (!player.playstyle || player.playstyle === 'None') {
                const key = `${(player.name || '').toLowerCase()}|${player.position}|${(player.club || '').toLowerCase()}`;
                let found = lookup.get(key);

                if (!found) {
                    const match = pesdbPlayers.find(ref =>
                        ref.name.toLowerCase() === (player.name || '').toLowerCase() &&
                        ref.position === player.position
                    );
                    if (match) found = match.playstyle;
                }

                if (found && found !== 'None') {
                    player.playstyle = found;
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            user.markModified('players');
            await user.save();
            console.log(`✅ Updated ${updatedCount} players!`);
        } else {
            console.log('No players needed updates.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

fixPlaystyles();
