require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5001;

// Load Local Database
const path = require('path');
const fs = require('fs');

let pesdbPlayers = [];
let soccerLeagues = [];

try {
  const playersPath = path.join(__dirname, 'data', 'pesdb_players.json');
  const leaguesPath = path.join(__dirname, 'data', 'leagues.json');

  if (fs.existsSync(playersPath)) {
    pesdbPlayers = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
    console.log(`✅ Loaded ${pesdbPlayers.length} players from local DB`);
  }

  if (fs.existsSync(leaguesPath)) {
    const leaguesData = JSON.parse(fs.readFileSync(leaguesPath, 'utf8'));
    soccerLeagues = leaguesData.countries || leaguesData; // Handle both formats
    console.log(`✅ Loaded ${soccerLeagues.length} leagues from local DB`);
  }
} catch (err) {
  console.error('❌ Error loading local database:', err);
}

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://efootball-8c9c5.web.app',
  'https://efootball-8c9c5.firebaseapp.com',
  'https://efootball-stats-tracker.vercel.app'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (origin.endsWith('.vercel.app') || origin.endsWith('.web.app')) return true;
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/efootball', {
  serverSelectionTimeoutMS: 20000
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'eFootball Stats API is running',
    endpoints: ['/api/players', '/api/auth/verify', '/api/search/players']
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ============================================
// AUTH ROUTES
// ============================================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    // Find or create the single user
    let user = await User.findOne({ username: 'admin' });

    if (!user) {
      // First time setup - create user with provided password
      const hashedPassword = await bcrypt.hash(password, 10);
      user = new User({
        username: 'admin',
        passwordHash: hashedPassword,
        players: []
      });
      await user.save();
      console.log('✅ First-time setup: User created');
    } else {
      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        // Allow re-setting password if it matches the env var (backdoor for admin)
        if (password === process.env.APP_PASSWORD) {
          console.log('Admin password override used');
        } else {
          return res.status(401).json({ error: 'Invalid password' });
        }
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        username: user.username,
        playerCount: user.players.length
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        username: user.username,
        playerCount: user.players.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Maintenance Routes (Temporary)
app.get('/api/maintenance/fix-playstyles', async (req, res) => {
  try {
    const users = await User.find({});
    let totalUpdated = 0;

    // Load reference data from local DB
    const refPath = path.join(__dirname, 'data', 'pesdb_players.json');
    if (!fs.existsSync(refPath)) {
      return res.status(500).json({ error: 'Reference data not found' });
    }
    const refPlayers = JSON.parse(fs.readFileSync(refPath, 'utf8'));

    for (const user of users) {
      let userUpdated = 0;
      user.players.forEach(player => {
        if (!player.playstyle || player.playstyle === 'None') {
          const name = (player.name || '').toLowerCase().trim();
          const pos = player.position;

          // Matching logic similar to fix_local_squad.js
          const match = refPlayers.find(r =>
            (r.name.toLowerCase().trim() === name || (r.search_name || '').toLowerCase().includes(name)) &&
            r.position === pos
          );

          if (match && match.playstyle && match.playstyle !== 'None') {
            player.playstyle = match.playstyle;
            userUpdated++;
          }
        }
      });

      if (userUpdated > 0) {
        user.markModified('players');
        await user.save();
        totalUpdated += userUpdated;
      }
    }

    res.json({ message: 'Fix completed', updatedCount: totalUpdated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch Playstyle Lookup
app.post('/api/maintenance/lookup-playstyles', async (req, res) => {
  try {
    const { players } = req.body;
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: 'Players array required' });
    }

    // Load reference data
    const refPath = path.join(__dirname, 'data', 'pesdb_players.json');
    if (!fs.existsSync(refPath)) {
      return res.status(500).json({ error: 'Reference data not found' });
    }
    const refPlayers = JSON.parse(fs.readFileSync(refPath, 'utf8'));

    const results = players.map(player => {
      const name = (player.name || '').toLowerCase().trim();
      const pos = player.position;

      const match = refPlayers.find(r =>
        (r.name.toLowerCase().trim() === name || (r.search_name || '').toLowerCase().includes(name)) &&
        r.position === pos
      );

      return {
        id: player.id || player._id,
        playstyle: (match && match.playstyle && match.playstyle !== 'None') ? match.playstyle : null
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============================================
// PLAYER ROUTES (Protected)
// ============================================

// Get all players
app.get('/api/players', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.players);
  } catch (error) {
    console.error('[GET /api/players] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add player
app.post('/api/players', authMiddleware, async (req, res) => {
  try {
    console.log('[POST /api/players] Request body size:', JSON.stringify(req.body).length);
    const user = await User.findById(req.userId);
    if (!user) {
      console.error('[POST /api/players] User not found for ID:', req.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const newPlayer = {
      ...req.body,
      _id: new mongoose.Types.ObjectId()
    };

    user.players.push(newPlayer);
    await user.save();
    console.log('[POST /api/players] Success, new player ID:', newPlayer._id);

    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('[POST /api/players] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update player
app.put('/api/players/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const playerIndex = user.players.findIndex(p => p._id.toString() === req.params.id);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Safe update: Merge existing data with new data
    const existingPlayer = user.players[playerIndex].toObject();
    user.players[playerIndex] = {
      ...existingPlayer,
      ...req.body,
      _id: existingPlayer._id // Ensure ID is never overwritten
    };

    await user.save();
    res.json(user.players[playerIndex]);
  } catch (error) {
    console.error('[PUT /api/players/:id] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete player
app.delete('/api/players/:id', authMiddleware, async (req, res) => {
  try {
    console.log(`[DELETE /api/players/:id] Request for ID: ${req.params.id}`);
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const initialLength = user.players.length;
    user.players = user.players.filter(p => p._id.toString() !== req.params.id);

    if (user.players.length === initialLength) {
      console.warn('[DELETE] Player not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Player not found' });
    }

    await user.save();
    console.log('[DELETE] Success');
    res.json({ message: 'Player deleted' });
  } catch (error) {
    console.error('[DELETE /api/players/:id] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// LEGACY ROUTES (for screenshots/links - optional)
// ============================================

// These can remain file-based or be migrated to MongoDB later
const {
  getScreenshots, saveScreenshots,
  getLinks, saveLinks
} = require('./db');

app.get('/api/screenshots', async (req, res) => {
  try {
    const data = await getScreenshots();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/screenshots', async (req, res) => {
  try {
    await saveScreenshots(req.body);
    res.status(201).json({ message: 'Screenshots saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/links', async (req, res) => {
  try {
    const data = await getLinks();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/links', async (req, res) => {
  try {
    await saveLinks(req.body);
    res.status(201).json({ message: 'Links saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SCRAPE ROUTES
// ============================================
app.use('/api/scrape', require('./routes/scrape'));

// ============================================
// SEARCH ROUTES (Local Database)
// ============================================

// Search players with filters and pagination
app.get('/api/search/players', (req, res) => {
  const {
    q = '',
    position,
    cardType,
    league,
    club,
    nationality,
    page = 1,
    limit = 50
  } = req.query;

  let results = [...pesdbPlayers];

  // Search Filter
  if (q && q.length >= 2) {
    const query = q.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.search_name?.toLowerCase().includes(query)
    );
  }

  // Attribute Filters
  if (position && position !== 'All') {
    results = results.filter(p => p.position === position);
  }
  if (cardType && cardType !== 'All') {
    results = results.filter(p => (p.card_type || p.cardType) === cardType);
  }
  if (league && league !== 'All') {
    results = results.filter(p => p.league === league);
  }
  if (club && club !== 'All') {
    results = results.filter(p => (p.club_original || p.club)?.toLowerCase().includes(club.toLowerCase()));
  }
  if (nationality && nationality !== 'All') {
    results = results.filter(p => p.nationality?.toLowerCase().includes(nationality.toLowerCase()));
  }

  // Pagination
  const total = results.length;
  const startIndex = (page - 1) * limit;
  const paginatedResults = results.slice(startIndex, startIndex + parseInt(limit));

  res.json({
    players: paginatedResults,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  });
});

// Search teams/clubs
app.get('/api/search/teams', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';
  if (query.length < 2) return res.json([]);

  // Extract unique clubs from players database
  const seenClubs = new Set();
  const results = [];

  for (const p of pesdbPlayers) {
    if (results.length >= 20) break;
    const clubName = p.club_original || p.club;
    if (clubName && clubName.toLowerCase().includes(query) && !seenClubs.has(clubName)) {
      seenClubs.add(clubName);
      results.push({
        strTeam: clubName,
        strBadge: p.club_badge_url,
        strLeague: p.league
      });
    }
  }

  res.json(results);
});

// Search leagues
app.get('/api/search/leagues', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';

  const results = soccerLeagues.filter(l =>
    l.strLeague.toLowerCase().includes(query) ||
    l.strLeagueAlternate?.toLowerCase().includes(query)
  ).slice(0, 20);

  res.json(results);
});

// Search countries
app.get('/api/search/countries', (req, res) => {
  const query = req.query.q?.toLowerCase() || '';

  // Extract unique countries
  const seenCountries = new Set();
  const results = [];

  for (const p of pesdbPlayers) {
    if (results.length >= 20) break;
    if (p.nationality && p.nationality.toLowerCase().includes(query) && !seenCountries.has(p.nationality)) {
      seenCountries.add(p.nationality);
      results.push({
        name: p.nationality,
        flag: p.nationality_flag_url
      });
    }
  }

  res.json(results);
});


// ============================================
// REDDIT PROXY ROUTE
// ============================================

app.get('/api/reddit/:subreddit/:sort', async (req, res) => {
  const { subreddit, sort } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const ALLOWED_SORTS = ['hot', 'new', 'top', 'rising'];

  if (!ALLOWED_SORTS.includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort' });
  }
  // Validate subreddit name: only alphanumeric + underscores, 2-50 chars
  if (!/^[a-zA-Z0-9_]{2,50}$/.test(subreddit)) {
    return res.status(400).json({ error: 'Invalid subreddit name' });
  }

  try {
    const axios = require('axios');
    const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}&raw_json=1`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'efootball-webapp/1.0 (by /u/efootball_app)',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const posts = response.data?.data?.children ?? [];
    res.json({ posts });
  } catch (err) {
    console.error('[Reddit Proxy] Error:', err.message);
    const status = err.response?.status || 500;
    res.status(status).json({ error: `Reddit API error: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
