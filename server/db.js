const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'players.json');
const SCREENSHOTS_FILE = path.join(DATA_DIR, 'screenshots.json');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');

// Ensure data directory and file exist
const initDB = async () => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        // Players
        try { await fs.access(DATA_FILE); }
        catch { await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2)); }
        // Screenshots
        try { await fs.access(SCREENSHOTS_FILE); }
        catch { await fs.writeFile(SCREENSHOTS_FILE, JSON.stringify([], null, 2)); }
        // Links
        try { await fs.access(LINKS_FILE); }
        catch { await fs.writeFile(LINKS_FILE, JSON.stringify([], null, 2)); }
    } catch (err) {
        console.error('Error initializing DB:', err);
    }
};

initDB();

const getPlayers = async () => {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
};

const savePlayers = async (players) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(players, null, 2));
};

const getScreenshots = async () => {
    const data = await fs.readFile(SCREENSHOTS_FILE, 'utf8');
    return JSON.parse(data);
};

const saveScreenshots = async (screenshots) => {
    await fs.writeFile(SCREENSHOTS_FILE, JSON.stringify(screenshots, null, 2));
};

const getLinks = async () => {
    const data = await fs.readFile(LINKS_FILE, 'utf8');
    return JSON.parse(data);
};

const saveLinks = async (links) => {
    await fs.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
};

const addPlayer = async (player) => {
    const players = await getPlayers();
    const newPlayer = {
        ...player,
        id: Date.now().toString(),
        goals: player.goals || 0,
        assists: player.assists || 0,
        matches: player.matches || 0
    };
    players.push(newPlayer);
    await savePlayers(players);
    return newPlayer;
};

const updatePlayer = async (id, updates) => {
    const players = await getPlayers();
    const index = players.findIndex(p => p.id === id);
    if (index === -1) return null;

    players[index] = { ...players[index], ...updates };
    await savePlayers(players);
    return players[index];
};

const deletePlayer = async (id) => {
    const players = await getPlayers();
    const newPlayers = players.filter(p => p.id !== id);
    if (players.length === newPlayers.length) return false;

    await savePlayers(newPlayers);
    return true;
};

module.exports = {
    getPlayers, addPlayer, updatePlayer, deletePlayer,
    getScreenshots, saveScreenshots,
    getLinks, saveLinks
};
