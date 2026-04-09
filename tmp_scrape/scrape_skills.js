const fs = require('fs');
const cheerio = require('cheerio');

const SKILL_NAMES = [
    "Scissors Feint", "Double Touch", "Flip Flap", "Marseille Turn", "Sombrero",
    "Chop Turn", "Cut Behind & Turn", "Scotch Move", "Sole Control", "Momentum Dribbling",
    "Acceleration Burst", "Magnetic Feet", "Heading", "Bullet Header", "Long-Range Curler",
    "Blitz Curler", "Chip Shot Control", "Knuckle Shot", "Dipping Shot", "Rising Shot",
    "Long Range Shooting", "Low Screamer", "Acrobatic Finishing", "Heel Trick", "First-time Shot",
    "Phenomenal Finishing", "Willpower", "One-touch Pass", "Through Passing", "Weighted Pass",
    "Pinpoint Crossing", "Edged Crossing", "Outside Curler", "Rabona", "No Look Pass",
    "Game-changing Pass", "Visionary Pass", "Phenomenal Pass", "Low Lofted Pass", "GK Low Punt",
    "GK High Punt", "Long Throw", "GK Long Throw", "Penalty Specialist", "GK Penalty Saver",
    "GK Directing Defence", "GK Spirit Roar", "Gamesmanship", "Man Marking", "Track Back",
    "Interception", "Blocker", "Aerial Superiority", "Sliding Tackle", "Long-reach Tackle",
    "Fortress", "Acrobatic Clearance", "Aerial Fort", "Captaincy", "Attack Trigger",
    "Super-sub", "Fighting Spirit"
];

async function scrapeSkills(id) {
    const url = `https://pesdb.net/efootball/?id=${id}`;
    const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error(`Failed to fetch ID ${id}: ${response.status}`);
            return null;
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const skills = [];
        
        // Detail page parsing
        // Look for the "Player Skills" header row
        $('table.player tr').each((i, el) => {
            const rowText = $(el).find('th').text().trim() || $(el).find('td').text().trim();
            if (rowText === 'Player Skills') {
                // Skills are in subsequent trs
                let next = $(el).next();
                while (next.length && next.find('td').length && !next.find('th').length) {
                    const skill = next.find('td').text().trim();
                    if (skill && SKILL_NAMES.includes(skill)) {
                        skills.push(skill);
                    }
                    next = next.next();
                }
            }
        });

        // Fallback for some page variants where it's a single row with comma/newline
        if (skills.length === 0) {
             $('table.player tr').each((i, el) => {
                const th = $(el).find('th').text().trim();
                const td = $(el).find('td').text().trim();
                if (th.includes('Player Skills')) {
                    td.split(/[\n,]+/).map(s => s.trim()).filter(s => s).forEach(s => {
                        if (SKILL_NAMES.includes(s)) skills.push(s);
                    });
                }
            });
        }

        return skills;
    } catch (error) {
        console.error(`Error scraping ID ${id}: ${error.message}`);
        return null;
    }
}

async function main() {
    const jsonPath = 'g:/Sunny Work/projects/efootball scrape/efootball_squad_2026-04-08.json';
    if (!fs.existsSync(jsonPath)) {
        console.error(`JSON file not found at ${jsonPath}`);
        return;
    }
    const players = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`Starting skills scrape of ${players.length} players...`);

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        
        // Skip if already has Skills (non-empty array)
        if (player.Skills && player.Skills.length > 0) continue;

        console.log(`[${i + 1}/${players.length}] Scraping skills for ${player.Name} (${player.ID})...`);
        
        const skills = await scrapeSkills(player.ID);
        if (skills) {
            player.Skills = skills;
            // Save every 20 players to avoid data loss
            if ((i + 1) % 20 === 0) {
                fs.writeFileSync(jsonPath, JSON.stringify(players, null, 2));
                console.log(`Progress saved at ${i + 1} players.`);
            }
        } else {
             // If failed, still ensure it's an empty array if not present
             if (!player.Skills) player.Skills = [];
        }

        // Delay between 5 and 10 seconds (being extra slow as requested)
        const delay = Math.floor(Math.random() * 5000) + 5000;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    fs.writeFileSync(jsonPath, JSON.stringify(players, null, 2));
    console.log('Skills scraping complete!');
}

main();
