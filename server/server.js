require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5001;

// ============================================
// LOAD LOCAL REFERENCE DATA (JSON files)
// ============================================
let pesdbPlayers = [];
let soccerLeagues = [];

const stripBOM = (content) => content.startsWith('\uFEFF') ? content.slice(1) : content;

try {
    const playersPath = path.join(__dirname, 'data', 'pesdb_players.json');
    const leaguesPath = path.join(__dirname, 'data', 'leagues.json');

    if (fs.existsSync(playersPath)) {
        pesdbPlayers = JSON.parse(stripBOM(fs.readFileSync(playersPath, 'utf8')));
        console.log(`✅ Loaded ${pesdbPlayers.length} players from local DB`);
    }
    if (fs.existsSync(leaguesPath)) {
        const leaguesData = JSON.parse(stripBOM(fs.readFileSync(leaguesPath, 'utf8')));
        soccerLeagues = leaguesData.countries || leaguesData;
        console.log(`✅ Loaded ${soccerLeagues.length} leagues from local DB`);
    }

    const attributesPath = path.join(__dirname, 'data', 'efootball_attributes.json');
    if (fs.existsSync(attributesPath)) {
        app.locals.attributes = JSON.parse(stripBOM(fs.readFileSync(attributesPath, 'utf8')));
        console.log('✅ Loaded eFootball attributes');
    }
} catch (err) {
    console.error('❌ Error loading local database:', err);
}

// ============================================
// CORS
// ============================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://efootball-8c9c5.web.app',
    'https://efootball-8c9c5.firebaseapp.com',
    'https://efootball-stats-tracker.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) ||
            origin.includes('localhost') || origin.includes('127.0.0.1') ||
            origin.endsWith('.vercel.app') || origin.endsWith('.web.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// ============================================
// AUTH MIDDLEWARE (Firebase Admin)
// ============================================
const { authMiddleware } = require('./middleware/auth');

// ============================================
// HEALTH & ROOT
// ============================================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'eFootball Stats API is running',
        database: 'Firebase Firestore',
        endpoints: ['/api/search/players', '/api/attributes', '/api/skills/:id', '/api/reddit/:sub/:sort']
    });
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// ============================================
// ATTRIBUTES
// ============================================
app.get('/api/attributes', (req, res) => {
    res.json(app.locals.attributes || { playstyles: [], positions: [], cardTypes: [], skills: [] });
});

// ============================================
// SEARCH ROUTES (Local JSON — read-only)
// ============================================

app.get('/api/search/players', (req, res) => {
    const { q = '', position, cardType, league, club, nationality, page = 1, limit = 50 } = req.query;
    let results = [...pesdbPlayers];

    if (q && q.length >= 2) {
        const query = q.toLowerCase();
        results = results.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.search_name?.toLowerCase().includes(query)
        );
    }
    if (position && position !== 'All') results = results.filter(p => p.position === position);
    if (cardType && cardType !== 'All') results = results.filter(p => (p.card_type || p.cardType) === cardType);
    if (league && league !== 'All') results = results.filter(p => p.league === league);
    if (club && club !== 'All') results = results.filter(p => (p.club_original || p.club)?.toLowerCase().includes(club.toLowerCase()));
    if (nationality && nationality !== 'All') results = results.filter(p => p.nationality?.toLowerCase().includes(nationality.toLowerCase()));

    const total = results.length;
    const startIndex = (page - 1) * limit;
    res.json({
        players: results.slice(startIndex, startIndex + parseInt(limit)),
        total, page: parseInt(page), limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    });
});

app.get('/api/search/teams', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    if (query.length < 2) return res.json([]);
    const seenClubs = new Set();
    const results = [];
    for (const p of pesdbPlayers) {
        if (results.length >= 20) break;
        const clubName = p.club_original || p.club;
        if (clubName && clubName.toLowerCase().includes(query) && !seenClubs.has(clubName)) {
            seenClubs.add(clubName);
            results.push({ strTeam: clubName, strBadge: p.club_badge_url, strLeague: p.league });
        }
    }
    res.json(results);
});

app.get('/api/search/leagues', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    res.json(soccerLeagues.filter(l =>
        l.strLeague.toLowerCase().includes(query) ||
        l.strLeagueAlternate?.toLowerCase().includes(query)
    ).slice(0, 20));
});

app.get('/api/search/countries', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const seenCountries = new Set();
    const results = [];
    for (const p of pesdbPlayers) {
        if (results.length >= 20) break;
        if (p.nationality && p.nationality.toLowerCase().includes(query) && !seenCountries.has(p.nationality)) {
            seenCountries.add(p.nationality);
            results.push({ name: p.nationality, flag: p.nationality_flag_url });
        }
    }
    res.json(results);
});

// ============================================
// PLAYSTYLE LOOKUP (Local JSON — no DB needed)
// ============================================
app.post('/api/maintenance/lookup-playstyles', (req, res) => {
    const { players } = req.body;
    if (!players || !Array.isArray(players)) {
        return res.status(400).json({ error: 'Players array required' });
    }
    const results = players.map(player => {
        const name = (player.name || '').toLowerCase().trim();
        const pos = player.position;
        const match = pesdbPlayers.find(r =>
            (r.name.toLowerCase().trim() === name || (r.search_name || '').toLowerCase().includes(name)) &&
            r.position === pos
        );
        return {
            id: player.id || player._id,
            playstyle: (match && match.playstyle && match.playstyle !== 'None') ? match.playstyle : null
        };
    });
    res.json(results);
});

// ============================================
// SKILLS SCRAPING
// ============================================
async function fetchPlayerPage(pesdbId) {
    try {
        const url = `https://efootball-world.com/player/${pesdbId}`;
        console.log(`📡 [Scraper] Fetching: ${url}`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000
        });
        return response.data;
    } catch (err) {
        if (err.response?.status === 404) {
            console.warn(`⚠️ Player ${pesdbId} not found (404)`);
            return null;
        }
        throw err;
    }
}

function parseSkillsFromHtml(html) {
    const $ = cheerio.load(html);
    const skills = [];
    const knownSkills = ['Super-sub', 'Double Touch', 'Interception', 'Blocker', 'Captaincy', 'First-time Shot'];

    const skillHeaders = $('th, td, div, h3, h4').filter((i, el) => {
        const txt = $(el).text().trim().toLowerCase();
        return txt === 'player skills' || txt === 'skills' || txt.includes('player skills');
    });

    skillHeaders.each((i, header) => {
        if (header.tagName === 'th' || header.tagName === 'td') {
            $(header).parent().nextAll('tr').each((j, row) => {
                if ($(row).find('th').length > 0 || /playing style|stats|rating/i.test($(row).text())) return false;
                const skill = $(row).find('td').text().trim();
                if (skill && skill.length > 2 && skill.length < 40 && !skills.includes(skill)) skills.push(skill);
            });
        } else {
            $(header).nextAll().find('li, .skill-item, .attribute-value').each((j, item) => {
                const skill = $(item).text().trim();
                if (skill && skill.length > 2 && !skills.includes(skill)) skills.push(skill);
            });
        }
    });

    if (skills.length === 0) {
        $('*').each((i, el) => {
            if ($(el).children().length === 0) {
                const text = $(el).text().trim();
                if (knownSkills.some(ks => text.toLowerCase() === ks.toLowerCase()) && !skills.includes(text)) {
                    skills.push(text);
                }
            }
        });
    }
    return skills;
}

// GET /api/skills/:pesdbId — get from local JSON, scrape if not found
app.get('/api/skills/:pesdbId', async (req, res) => {
    try {
        const { pesdbId } = req.params;
        const localPlayer = pesdbPlayers.find(p =>
            String(p.id) === String(pesdbId) ||
            String(p.pesdb_id) === String(pesdbId) ||
            String(p.playerId) === String(pesdbId)
        );

        if (localPlayer?.skills?.length > 0) {
            console.log(`✅ Skills for ${pesdbId} from local DB`);
            return res.json({ pesdb_id: pesdbId, skills: localPlayer.skills, source: 'local' });
        }

        console.log(`🔍 Scraping skills for ${pesdbId}...`);
        const html = await fetchPlayerPage(pesdbId);
        const skills = html ? parseSkillsFromHtml(html) : [];
        res.json({ pesdb_id: pesdbId, skills, source: 'scraped' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve skills: ' + err.message });
    }
});

// POST /api/skills/bulk — local DB bulk skills lookup
app.post('/api/skills/bulk', (req, res) => {
    try {
        const { pesdbIds } = req.body;
        if (!Array.isArray(pesdbIds)) return res.status(400).json({ error: 'Array of pesdbIds required' });

        const results = {};
        for (const pesdbId of pesdbIds) {
            if (!pesdbId) continue;
            const p = pesdbPlayers.find(p =>
                String(p.id) === String(pesdbId) ||
                String(p.pesdb_id) === String(pesdbId) ||
                String(p.playerId) === String(pesdbId)
            );
            if (p?.skills?.length > 0) results[pesdbId] = p.skills;
        }
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// SCRAPE ROUTE
// ============================================
app.use('/api/scrape', require('./routes/scrape'));

// ============================================
// REDDIT PROXY
// ============================================
app.get('/api/reddit/:subreddit/:sort', async (req, res) => {
    const { subreddit, sort } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const ALLOWED_SORTS = ['hot', 'new', 'top', 'rising'];

    if (!ALLOWED_SORTS.includes(sort)) return res.status(400).json({ error: 'Invalid sort' });
    if (!/^[a-zA-Z0-9_]{2,50}$/.test(subreddit)) return res.status(400).json({ error: 'Invalid subreddit name' });

    try {
        const response = await axios.get(`https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`, {
            headers: { 'User-Agent': 'efootball-webapp/1.0', 'Accept': 'application/json' },
            timeout: 10000
        });
        res.json({ posts: response.data?.data?.children ?? [] });
    } catch (err) {
        res.status(500).json({ error: 'Reddit fetch failed: ' + err.message });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 Database: Firebase Firestore (managed by client)`);
});
