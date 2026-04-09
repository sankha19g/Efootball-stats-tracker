const cheerio = require('cheerio');

const skillMapping = {
    "s01": "Scissors Feint", "s02": "Double Touch", "s03": "Flip Flap", "s04": "Marseille Turn", "s05": "Sombrero",
    "s06": "Chop Turn", "s07": "Cut Behind & Turn", "s08": "Scotch Move", "s09": "Sole Control", "s10": "Momentum Dribbling",
    "s11": "Acceleration Burst", "s12": "Magnetic Feet", "s13": "Heading", "s14": "Bullet Header", "s15": "Long-Range Curler",
    "s16": "Blitz Curler", "s17": "Chip Shot Control", "s18": "Knuckle Shot", "s19": "Dipping Shot", "s20": "Rising Shot",
    "s21": "Long Range Shooting", "s22": "Low Screamer", "s23": "Acrobatic Finishing", "s24": "Heel Trick", "s25": "First-time Shot",
    "s26": "Phenomenal Finishing", "s27": "Willpower", "s28": "One-touch Pass", "s29": "Through Passing", "s30": "Weighted Pass",
    "s31": "Pinpoint Crossing", "s32": "Edged Crossing", "s33": "Outside Curler", "s34": "Rabona", "s35": "No Look Pass",
    "s36": "Game-changing Pass", "s37": "Visionary Pass", "s38": "Phenomenal Pass", "s39": "Low Lofted Pass", "s40": "GK Low Punt",
    "s41": "GK High Punt", "s42": "Long Throw", "s43": "GK Long Throw", "s44": "Penalty Specialist", "s45": "GK Penalty Saver",
    "s46": "GK Directing Defence", "s47": "GK Spirit Roar", "s48": "Gamesmanship", "s49": "Man Marking", "s50": "Track Back",
    "s51": "Interception", "s52": "Blocker", "s53": "Aerial Superiority", "s54": "Sliding Tackle", "s55": "Long-reach Tackle",
    "s56": "Fortress", "s57": "Acrobatic Clearance", "s58": "Aerial Fort", "s59": "Captaincy", "s60": "Attack Trigger",
    "s61": "Super-sub", "s62": "Fighting Spirit"
};

async function test(id) {
    const columns = Object.keys(skillMapping).join(',');
    const url = `https://pesdb.net/efootball/?id=${id}&columns=${columns}`;
    console.log(`Fetching ${url}`);
    
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // If redirected to detail page, table.players won't exist
    if ($('table.players').length === 0) {
        console.log("Redirected to detail page.");
        const skills = [];
        $('table.player tr').each((i, el) => {
            const th = $(el).find('th').text().trim();
            const td = $(el).find('td').text().trim();
            if (th === 'Player Skills:') {
                td.split('\n').map(s => s.trim()).filter(s => s).forEach(s => skills.push(s));
            }
        });
        console.log("Skills found from detail page:", skills);
        return;
    }

    const headers = [];
    $('table.players thead th').each((i, el) => {
        headers.push($(el).text().trim());
    });
    console.log("Headers found:", headers.join(', '));

    const row = $(`table.players tr:has(a[href*="id=${id}"])`);
    if (row.length === 0) {
        console.log("Player row not found in table.");
        return;
    }

    const playerSkills = [];
    row.find('td').each((i, el) => {
        const header = headers[i];
        const value = $(el).text().trim();
        if (header.startsWith('S') && (value === 'Y' || value === '1')) {
            const skillName = skillMapping[header.toLowerCase()];
            if (skillName) playerSkills.push(skillName);
        }
    });

    console.log("Player Skills found from list view:", playerSkills);
}

test('52899770115621'); // Thuram
