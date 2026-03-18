const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const dataPathServer = path.join(__dirname, '..', 'data', 'pesdb_players.json');
const dataPathClient = path.join(__dirname, '..', '..', 'client', 'public', 'data', 'pesdb_players.json');

// Map countries to flagsapi.com country codes (basic ones)
const countryCodeMap = {
    'England': 'GB-ENG', 'Spain': 'ES', 'France': 'FR', 'Italy': 'IT',
    'Germany': 'DE', 'Brazil': 'BR', 'Argentina': 'AR', 'Portugal': 'PT',
    'Netherlands': 'NL', 'Belgium': 'BE', 'Uruguay': 'UY', 'Colombia': 'CO',
    'Senegal': 'SN', 'Morocco': 'MA', 'USA': 'US', 'Japan': 'JP', 'Türkiye': 'TR',
    'Nigeria': 'NG', 'Poland': 'PL', 'Norway': 'NO', 'Egypt': 'EG', 'Wales': 'GB-WLS',
    'Denmark': 'DK', 'Sweden': 'SE', 'Northern Ireland': 'GB-NIR', 'Hungary': 'HU',
    'Scotland': 'GB-SCT', 'Croatia': 'HR', 'Serbia': 'RS', 'Switzerland': 'CH'
};

async function scrapeSinglePlayer(url) {
    console.log('[Scraper] Fetching Single Player URL:', url);
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000
    });

    const $ = cheerio.load(data);
    const idMatch = url.match(/id=(\d+)/);
    const id = idMatch ? idMatch[1] : '';

    if (!id) throw new Error('Could not extract player ID from URL');

    const player = {
        id,
        name: '',
        image: '',
        nationality: '',
        club: '',
        league: 'Other',
        position: '',
        card_type: 'Normal',
        playstyle: 'None',
        rating: 0,
        skills: []
    };

    // Extract basic info from table.player
    $('table.player th').each((idx, th) => {
        const headerText = $(th).text().trim().toLowerCase();
        const nextTd = $(th).next('td');
        const val = nextTd.text().trim();

        if (headerText.includes('player name')) player.name = val;
        if (headerText.includes('nationality')) player.nationality = val;
        if (headerText.includes('team name')) player.club = val;
        if (headerText.includes('league')) player.league = val;
        if (headerText.includes('position')) player.position = val;
        if (headerText.includes('overall rating')) player.rating = parseInt(val) || 0;
        
        if (headerText.includes('playing style')) {
            const nextRowText = $(th).parent().next('tr').find('td').text().trim();
            if (nextRowText) player.playstyle = nextRowText;
        }

        if (headerText.includes('player skills')) {
            $(th).parent().nextAll('tr').each((j, row) => {
                if ($(row).find('th').length > 0) return false;
                const skill = $(row).find('td').text().trim();
                if (skill && player.skills.length < 10) {
                    player.skills.push(skill);
                }
            });
        }
    });

    // Fallback for skills/playstyle if not found in the loop above
    if (player.skills.length === 0) {
        $('th').each((i, el) => {
            const txt = $(el).text().trim().toLowerCase();
            if (txt.includes('player skills')) {
                $(el).parent().nextAll('tr').each((j, row) => {
                    if ($(row).find('th').length > 0) return false;
                    const skill = $(row).find('td').text().trim();
                    if (skill && player.skills.length < 10) {
                        player.skills.push(skill);
                    }
                });
            }
        });
    }

    // If name is still empty, try to get it from the page title or another header
    if (!player.name) {
        player.name = $('h1').first().text().split('-')[0].trim() || 'Unknown Player';
    }

    // Image extraction
    $('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && src.includes('img/card/')) {
            let realImageUrl = src;
            if (!realImageUrl.startsWith('http')) {
                realImageUrl = realImageUrl.replace(/^\.\//, '');
                if (!realImageUrl.startsWith('/')) {
                    realImageUrl = '/' + realImageUrl;
                }
                realImageUrl = 'https://pesdb.net' + realImageUrl;
            }
            player.image = realImageUrl;
            return false;
        }
    });

    // Nationality Flag
    const nationalityLower = (player.nationality || '').toLowerCase();
    const countryEntry = Object.entries(countryCodeMap).find(([name]) => name.toLowerCase() === nationalityLower);
    const cc = countryEntry ? countryEntry[1] : null;
    player.nationality_flag_url = cc ? `https://flagsapi.com/${cc}/flat/64.png` : '';

    // Card Type Inference
    if (id.length >= 14) player.card_type = 'Featured';
    if (url.includes('epic=')) player.card_type = 'Epic';
    if (url.includes('featured=')) player.card_type = 'Featured';

    player.search_name = player.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return player;
}

async function scrapePesdb(url) {
    // If it's a detail page, use the single player scraper
    if (url.includes('id=') && !url.includes('all=') && !url.includes('featured=') && !url.includes('epic=')) {
        const player = await scrapeSinglePlayer(url);
        return [player];
    }

    console.log('[Scraper] Fetching List URL:', url);
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 15000 // 15s timeout for main list
    });

    const $ = cheerio.load(data);
    const scrapedPlayers = [];

    // PESDB list page has table.players
    $('table.players tr').each((i, el) => {
        if (i === 0) return; // skip header

        const tds = $(el).find('td');
        if (tds.length === 0) return;

        const aTag = tds.eq(1).find('a');
        const idMatch = aTag.attr('href')?.match(/id=(\d+)/);

        if (idMatch) {
            const id = idMatch[1];
            const name = aTag.text().trim();
            const position = tds.eq(0).text().trim();
            const club = tds.eq(2).text().trim();
            const nationality = tds.eq(3).text().trim();

            // Infer Card Type based on URL structure or fallback to "Featured" if it's a pack
            let card_type = 'Normal';
            if (url.includes('featured=')) card_type = 'Featured';
            if (url.includes('epic=')) card_type = 'Epic';
            if (id.length >= 14 && url.includes('featured=')) card_type = 'Featured';

            // Special images: f[ID]max.png
            const isSpecialCard = id.length >= 10 && id.startsWith('1') || id.startsWith('8');
            const prefix = isSpecialCard ? 'f' : '';
            const suffix = isSpecialCard ? 'max.png' : '.png';
            const imageUrl = `https://pesdb.net/assets/img/card/${prefix}${id}${suffix}`;

            const cc = countryCodeMap[nationality];
            const flagUrl = cc ? `https://flagsapi.com/${cc}/flat/64.png` : '';

            scrapedPlayers.push({
                id,
                name,
                image: imageUrl,
                nationality,
                club,
                league: 'Other', // Unknown without detail page
                position,
                card_type,
                search_name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                nationality_flag_url: flagUrl,
                club_original: club,
                club_badge_url: '',
                playstyle: 'None' // Requires individual page scraping
            });
        }
    });

    console.log(`[Scraper] Found ${scrapedPlayers.length} players. Fetching details...`);
 
     const BATCH_SIZE = 5;
     for (let i = 0; i < scrapedPlayers.length; i += BATCH_SIZE) {
         const batch = scrapedPlayers.slice(i, i + BATCH_SIZE);
         await Promise.all(batch.map(async (player) => {
             try {
                 const detailUrl = `https://pesdb.net/efootball/?id=${player.id}`;
                 const { data: detailData } = await axios.get(detailUrl, {
                     headers: {
                         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                     },
                     timeout: 8000
                 });
                 const detail$ = cheerio.load(detailData);
 
                 detail$('table.player th').each((idx, th) => {
                     const headerText = detail$(th).text().trim().toLowerCase();
 
                     if (headerText.includes('playing style')) {
                         player.playstyle = detail$(th).parent().next('tr').find('td').text().trim() || 'None';
                     }
 
                     if (headerText.includes('league')) {
                         player.league = detail$(th).next('td').text().trim() || 'Other';
                     }
                 });

                 // Extract Skills in batch fetch
                 detail$('th').each((i, el) => {
                    if (detail$(el).text().trim().toLowerCase().includes('player skills')) {
                        detail$(el).parent().nextAll('tr').each((j, row) => {
                            if (detail$(row).find('th').length > 0) return false;
                            const skill = detail$(row).find('td').text().trim();
                            if (skill && player.skills.length < 10) {
                                player.skills.push(skill);
                            }
                        });
                    }
                 });
 
                 // Extract accurate image
                 detail$('img').each((i, img) => {
                     const src = detail$(img).attr('src');
                     if (src && src.includes('img/card/')) {
                         let realImageUrl = src;
                         if (!realImageUrl.startsWith('http')) {
                             realImageUrl = realImageUrl.replace(/^\.\//, '');
                             if (!realImageUrl.startsWith('/')) {
                                 realImageUrl = '/' + realImageUrl;
                             }
                             realImageUrl = 'https://pesdb.net' + realImageUrl;
                         }
                         player.image = realImageUrl;
                         return false;
                     }
                 });
             } catch (err) {
                 console.error(`[Scraper] Warning: Failed to fetch detail for ${player.name}:`, err.message);
             }
         }));
     }

    return scrapedPlayers;
}


router.post('/', async (req, res) => {
    try {
        const { url, urls } = req.body;
        console.log('[Scraper] Received request with body keys:', Object.keys(req.body || {}));

        let inputUrls = urls || url || [];
        let targetUrls = [];

        if (Array.isArray(inputUrls)) {
            targetUrls = [...inputUrls];
        } else if (typeof inputUrls === 'string') {
            targetUrls = inputUrls.split(/[\n,]/).map(u => u.trim()).filter(u => u);
        } else if (inputUrls) {
            // If it's some other non-null value, try to convert to array
            targetUrls = [String(inputUrls)];
        }

        // Final safety check to ensure it's still an array and contains strings
        if (!Array.isArray(targetUrls)) {
            console.error('[Scraper] targetUrls is not an array:', typeof targetUrls);
            targetUrls = [];
        }

        targetUrls = targetUrls.map(u => String(u).trim()).filter(u => u && u.includes('pesdb.net'));

        if (targetUrls.length === 0) {
            return res.status(400).json({ error: 'Please provide at least one valid PESDB URL.' });
        }

        let allScrapedPlayers = [];

        for (const u of targetUrls) {
            try {
                const playersFromUrl = await scrapePesdb(u);
                allScrapedPlayers = [...allScrapedPlayers, ...playersFromUrl];
            } catch (err) {
                console.error(`[Scraper] Error scraping ${u}:`, err.message);
            }
        }

        // Deduplicate if same player appeared in multiple links
        const uniqueMap = new Map();
        allScrapedPlayers.forEach(p => uniqueMap.set(p.id, p));
        const scrapedPlayers = Array.from(uniqueMap.values());

        if (scrapedPlayers.length === 0) {
            return res.status(400).json({ error: 'No players found on those pages. Make sure they are list view URLs.' });
        }

        console.log(`[Scraper] Scraped ${scrapedPlayers.length} players. Updating local DB...`);

        let newCount = 0;
        let updateCount = 0;

        try {
            // Update server DB
            let currentPlayers = [];
            if (fs.existsSync(dataPathServer)) {
                currentPlayers = JSON.parse(fs.readFileSync(dataPathServer, 'utf-8'));
            }

            scrapedPlayers.forEach(p => {
                const index = currentPlayers.findIndex(existing => existing.id === p.id);
                if (index !== -1) {
                    // Update existing
                    currentPlayers[index] = { ...currentPlayers[index], ...p };
                    updateCount++;
                } else {
                    // Prepend to show up first
                    currentPlayers.unshift(p);
                    newCount++;
                }
            });

            // Write to Server Data (if possible)
            fs.writeFileSync(dataPathServer, JSON.stringify(currentPlayers, null, 2));

            // Write to Client Public Data (if possible)
            if (fs.existsSync(path.dirname(dataPathClient))) {
                fs.writeFileSync(dataPathClient, JSON.stringify(currentPlayers, null, 2));
            }
        } catch (fsError) {
            console.warn('[Scraper] Could not save to local filesystem (likely Vercel/Read-only):', fsError.message);
            // On Vercel, we can't save to the JSON, so all scraped players are considered "new" for the current response
            newCount = scrapedPlayers.length;
            updateCount = 0;
        }

        return res.json({
            success: true,
            message: `Scraped successfully. ${newCount} players returned.`,
            added: newCount,
            updated: updateCount,
            players: scrapedPlayers
        });

    } catch (err) {
        console.error('[Scraper] Error:', err);
        return res.status(500).json({ error: err.message || 'Server error during scraping.' });
    }
});

module.exports = router;
