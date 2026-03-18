/**
 * scrape_skills.js
 * Scrapes "Player Skills" from efootball-world.com for every player in pesdb_players.json
 * and saves the result back to the same file.
 *
 * Usage:
 *   node scripts/scrape_skills.js            → scrape ALL players
 *   node scripts/scrape_skills.js --test 5   → test first 5 players only
 *   node scripts/scrape_skills.js --resume   → skip players that already have skills
 */

const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/pesdb_players.json');
const CONCURRENCY = 4;    // parallel requests
const DELAY_MS = 600;     // delay between batches (ms)
const MAX_RETRIES = 3;
const SAVE_EVERY = 100;   // auto-save checkpoint every N players
const BASE_URL = 'https://efootball-world.com/player/';

const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const TEST_COUNT = TEST_MODE ? parseInt(args[args.indexOf('--test') + 1] || '5') : null;
const RESUME_MODE = args.includes('--resume');

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ─── Fetch a page using native https (bypasses Cloudflare) ────────────────────
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            timeout: 15000
        };

        const req = https.get(url, options, (res) => {
            if (res.statusCode === 404) {
                res.resume();
                return resolve(null); // player not on this site
            }
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }

            let stream = res;
            const enc = res.headers['content-encoding'];
            if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
            else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());
            else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());

            const chunks = [];
            stream.on('data', c => chunks.push(c));
            stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
            stream.on('error', reject);
        });

        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
    });
}

// ─── Parse player skills from the page HTML ───────────────────────────────────
const STAT_LABELS = new Set(['SHT','PAS','DRI','DEX','LBS','AER','DEF','GK1']);

function parseSkills(html) {
    const $ = cheerio.load(html);
    const skills = [];
    let inSkillSection = false;

    $('*').each((i, el) => {
        if ($(el).children().length > 0) return; // skip non-leaf nodes
        const text = $(el).text().trim();
        if (!text || text.length > 60) return;

        if (text === 'Player Skills') {
            inSkillSection = true;
            return;
        }
        // Stop at AI Playing Styles or stat label rows
        if (text === 'AI Playing Styles' || STAT_LABELS.has(text)) {
            inSkillSection = false;
            return;
        }

        if (inSkillSection) {
            skills.push(text);
        }
    });

    return skills;
}

// ─── Scrape skills for a single player ID with retry ──────────────────────────
async function scrapeSkills(id) {
    const url = `${BASE_URL}${id}`;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const html = await fetchPage(url);
            if (html === null) return []; // 404 → player not found, store empty
            return parseSkills(html);
        } catch (err) {
            if (attempt < MAX_RETRIES) {
                await sleep(attempt * 1500);
            } else {
                return null; // give up after all retries
            }
        }
    }
    return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('📖 Loading players...');
    const players = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`   ${players.length} total players in DB`);

    const playerIndexMap = new Map();
    players.forEach((p, i) => playerIndexMap.set(p.id, i));

    let targets = players;

    if (RESUME_MODE) {
        targets = players.filter(p => !p.skills);
        console.log(`   Resuming: ${targets.length} players without skills`);
    }

    if (TEST_MODE) {
        targets = targets.slice(0, TEST_COUNT);
        console.log(`   TEST MODE: only ${targets.length} players`);
    }

    console.log(`\n🚀 Scraping ${targets.length} players via efootball-world.com (concurrency=${CONCURRENCY})...\n`);

    let successCount = 0;
    let failCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < targets.length; i += CONCURRENCY) {
        const batch = targets.slice(i, i + CONCURRENCY);

        const results = await Promise.all(
            batch.map(async (player) => ({ player, skills: await scrapeSkills(player.id) }))
        );

        for (let j = 0; j < results.length; j++) {
            const { player, skills } = results[j];
            const displayIdx = i + j + 1;
            const globalIdx = playerIndexMap.get(player.id);

            if (skills === null) {
                failCount++;
                console.log(`  [${displayIdx}] ❌ Failed:    ${player.name} (${player.id})`);
            } else if (skills.length === 0) {
                notFoundCount++;
                players[globalIdx].skills = [];
                console.log(`  [${displayIdx}] ⚠️  Not found: ${player.name} (${player.id})`);
            } else {
                successCount++;
                players[globalIdx].skills = skills;
                console.log(`  [${displayIdx}] ✅ ${player.name} → [${skills.join(', ')}]`);
            }
        }

        // Checkpoint save every SAVE_EVERY players
        if (Math.floor((i + CONCURRENCY) / SAVE_EVERY) > Math.floor(i / SAVE_EVERY) || i + CONCURRENCY >= targets.length) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
            console.log(`  💾 Checkpoint saved (${Math.min(i + CONCURRENCY, targets.length)}/${targets.length})`);
        }

        if (i + CONCURRENCY < targets.length) {
            await sleep(DELAY_MS);
        }
    }

    console.log(`\n✅ Scraping complete!`);
    console.log(`   ✅ Success:   ${successCount}`);
    console.log(`   ⚠️  Not found: ${notFoundCount}`);
    console.log(`   ❌ Failed:    ${failCount}`);
    console.log('\n💾 Final save...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2));
    console.log('✅ All done!');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
