const fs = require('fs');
const path = require('path');

async function fixLocalPlayers() {
    try {
        const squadPath = path.join(__dirname, '../../data/players.json');
        const refPath = path.join(__dirname, '../data/pesdb_players.json');

        if (!fs.existsSync(squadPath)) return;

        console.log('Loading reference data...');
        const refData = JSON.parse(fs.readFileSync(refPath, 'utf8'));

        console.log('Loading local squad...');
        let squad = JSON.parse(fs.readFileSync(squadPath, 'utf8'));
        let updatedCount = 0;

        squad.forEach(player => {
            if (!player.playstyle || player.playstyle === 'None') {
                const name = (player.name || '').toLowerCase().trim();
                const pos = player.position;

                // Try exact match first
                let match = refData.find(r =>
                    r.name.toLowerCase().trim() === name &&
                    r.position === pos
                );

                // If not found, try "contains" match (e.g., "Messi" matches "Lionel Messi")
                if (!match) {
                    match = refData.find(r =>
                        (r.name.toLowerCase().includes(name) || name.includes(r.name.toLowerCase())) &&
                        r.position === pos
                    );
                }

                // If still not found, try matching by search_name
                if (!match) {
                    match = refData.find(r =>
                        (r.search_name || '').toLowerCase().includes(name) &&
                        r.position === pos
                    );
                }

                if (match && match.playstyle && match.playstyle !== 'None') {
                    console.log(`[FIX] ${player.name} (${pos}): -> ${match.playstyle} (Matched with ${match.name})`);
                    player.playstyle = match.playstyle;
                    updatedCount++;
                }
            }
        });

        if (updatedCount > 0) {
            fs.writeFileSync(squadPath, JSON.stringify(squad, null, 2));
            console.log(`✅ Updated ${updatedCount} players in data/players.json`);
        } else {
            console.log('No players in data/players.json needed updates.');
        }

    } catch (err) {
        console.error('Error fixing local players:', err.message);
    }
}

fixLocalPlayers();
