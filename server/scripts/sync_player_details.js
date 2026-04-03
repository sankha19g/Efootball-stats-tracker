const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');

// Setup
require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/efootball';
const PESDB_JSON_PATH = path.join(__dirname, '..', 'data', 'pesdb_players.json');
const CLIENT_JSON_PATH = path.join(__dirname, '..', 'client', 'public', 'data', 'pesdb_players.json');

async function updatePlayerInfo() {
    console.log('--- Starting Player Info Update (Age, Height, Foot) ---');

    // 1. Load Local JSON
    let pesdbData = [];
    if (fs.existsSync(PESDB_JSON_PATH)) {
        pesdbData = JSON.parse(fs.readFileSync(PESDB_JSON_PATH, 'utf8'));
    }
    console.log(`Loaded ${pesdbData.length} players from local JSON.`);

    // 2. Connect to MongoDB
    try {
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
        console.log('Connected to MongoDB.');
    } catch (err) {
        console.warn('MongoDB Connection Warning (Skipping Cloud Sync):', err.message);
        // Continue anyway to update local JSON
    }

    let users = [];
    if (mongoose.connection.readyState === 1) {
        users = await User.find({});
        console.log(`Found ${users.length} users.`);
    } else {
        console.log('Skipping MongoDB player updates (Offline).');
    }

    const allPlayerIds = new Set();
    pesdbData.forEach(p => allPlayerIds.add(p.id));

    const squadPlayerIds = new Set();
    if (users.length > 0) {
        users.forEach(u => u.players.forEach(p => {
            const pid = p.id || (p._id && p._id.toString());
            if (pid && /^\d+$/.test(pid)) {
                squadPlayerIds.add(pid);
                allPlayerIds.add(pid);
            }
        }));
    }

    // Identify unique IDs and SORT them
    const validIds = Array.from(allPlayerIds)
        .filter(id => id && /^\d+$/.test(id))
        .sort((a, b) => {
            const aInSquad = squadPlayerIds.has(a.toString()) ? 0 : 1;
            const bInSquad = squadPlayerIds.has(b.toString()) ? 0 : 1;
            return aInSquad - bInSquad;
        });

    console.log(`Identified ${validIds.length} players. ${squadPlayerIds.size} are in user squads (Prioritizing these).`);

    let updatedJsonCount = 0;
    let updatedUsersCount = 0;

    // Helper to scrape a single player with retry logic
    async function scrapeDetails(id, retries = 3, delay = 2000) {
        const url = `https://pesdb.net/efootball/?id=${id}`;
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                timeout: 10000
            });
            const $ = cheerio.load(data);
            const info = {};

            $('tr').each((i, tr) => {
                const text = $(tr).text().trim();
                if (text.startsWith('Height:')) info.height = parseInt(text.replace('Height:', '').trim());
                if (text.startsWith('Age:')) info.age = parseInt(text.replace('Age:', '').trim());
                if (text.startsWith('Foot:')) {
                    const footText = text.replace('Foot:', '').trim().toLowerCase();
                    info.strongFoot = footText.includes('right') ? 'Right' : 'Left';
                }
            });

            return Object.keys(info).length > 0 ? info : null;
        } catch (err) {
            if (err.response && err.response.status === 429 && retries > 0) {
                console.warn(` Rate limit (429) hit for ID ${id}. Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(r => setTimeout(r, delay));
                return scrapeDetails(id, retries - 1, delay * 2);
            }
            console.error(` Error scraping ${id}: ${err.message}`);
            return null;
        }
    }

    // Process IDs (In batches of 1 to be VERY slow and avoid 429s)
    const BATCH_SIZE = 1;
    for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
        const batch = validIds.slice(i, i + BATCH_SIZE);

        // Filter batch to only those that NEED updates
        const needsUpdate = batch.filter(id => {
            const p = pesdbData.find(player => player.id === id);
            // Check if player exists and is missing ANY of the three details
            return !p || p.age === undefined || p.height === undefined || p.strongFoot === undefined;
        });

        if (needsUpdate.length === 0) {
            console.log(`Skipping batch ${i / BATCH_SIZE + 1} (All entries in local JSON have data).`);
            continue;
        }

        console.log(`Processing batch ${i / BATCH_SIZE + 1} (${needsUpdate.length} updates needed)... (${i}/${validIds.length})`);

        await Promise.all(needsUpdate.map(async (id) => {
            const details = await scrapeDetails(id);
            if (!details) return;

            // Update JSON
            const jsonIdx = pesdbData.findIndex(p => p.id === id);
            if (jsonIdx !== -1) {
                pesdbData[jsonIdx] = { ...pesdbData[jsonIdx], ...details };
                updatedJsonCount++;
            }

            // Update Users (only if mongo connected)
            if (mongoose.connection.readyState === 1) {
                let userModified = false;
                users.forEach(u => {
                    u.players.forEach(p => {
                        if (p.id === id || (p._id && p._id.toString() === id)) {
                            Object.assign(p, details);
                            userModified = true;
                        }
                    });
                });
                if (userModified) updatedUsersCount++;
            }
        }));

        // Periodic save every 100 players (since batch is 1)
        if ((i / BATCH_SIZE + 1) % 100 === 0) {
            console.log('--- Periodic Save ---');
            const jsonString = JSON.stringify(pesdbData, null, 2);
            fs.writeFileSync(PESDB_JSON_PATH, jsonString);
            if (fs.existsSync(CLIENT_JSON_PATH)) {
                fs.writeFileSync(CLIENT_JSON_PATH, jsonString);
            }
        }

        // Delay between players to avoid 429
        await new Promise(r => setTimeout(r, 2000));
    }

    // 4. Save results
    console.log('Saving updates...');

    // Save JSONs
    const jsonString = JSON.stringify(pesdbData, null, 2);
    fs.writeFileSync(PESDB_JSON_PATH, jsonString);
    if (fs.existsSync(CLIENT_JSON_PATH)) {
        fs.writeFileSync(CLIENT_JSON_PATH, jsonString);
    }

    // Save Users
    for (const u of users) {
        u.markModified('players');
        await u.save();
    }

    console.log(`--- Update Finished ---`);
    console.log(`Updated attributes for ${updatedJsonCount} entries in local JSON.`);
    console.log(`Updated attributes for players in ${updatedUsersCount} user accounts.`);

    process.exit(0);
}

updatePlayerInfo();
