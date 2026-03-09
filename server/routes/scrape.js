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

async function scrapePesdb(url) {
    console.log('[Scraper] Fetching URL:', url);
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

    console.log(`[Scraper] Found ${scrapedPlayers.length} players. Fetching details for each (Playstyles & Leagues) in batches...`);

    // Concurrently fetch player detail pages in small batches to avoid rate limiting or timeouts
    const BATCH_SIZE = 5;
    for (let i = 0; i < scrapedPlayers.length; i += BATCH_SIZE) {
        const batch = scrapedPlayers.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (player) => {
            try {
                const detailUrl = `https://pesdb.net/pes2022/?id=${player.id}`;
                const { data: detailData } = await axios.get(detailUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                    timeout: 8000 // 8s timeout for detail pages
                });
                const detail$ = cheerio.load(detailData);

                detail$('table.player th').each((idx, th) => {
                    const headerText = detail$(th).text().trim();

                    if (headerText === 'Playing Style') {
                        player.playstyle = detail$(th).parent().next('tr').text().trim() || 'None';
                    }

                    if (headerText === 'League:') {
                        player.league = detail$(th).next('td').text().trim() || 'Other';
                    }
                });

                // Extract accurate image directly from their detailed page, overriding the guess
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
        console.log(`[Scraper] Finished batch ${Math.floor(i / BATCH_SIZE) + 1} (${Math.min(i + BATCH_SIZE, scrapedPlayers.length)}/${scrapedPlayers.length})`);
    }

    return scrapedPlayers;
}

router.post('/', async (req, res) => {
    try {
        const { url, urls } = req.body;
        let targetUrls = urls;

        // Fallback for single url string or newline-separated string
        if (!targetUrls) {
            if (typeof url === 'string') {
                targetUrls = url.split('\n');
            } else {
                targetUrls = [];
            }
        }

        targetUrls = targetUrls.map(u => u.trim()).filter(u => u && u.includes('pesdb.net'));

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

        // Update server DB
        let currentPlayers = [];
        if (fs.existsSync(dataPathServer)) {
            currentPlayers = JSON.parse(fs.readFileSync(dataPathServer, 'utf-8'));
        }

        let newCount = 0;
        let updateCount = 0;

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

        // Write to Server Data
        fs.writeFileSync(dataPathServer, JSON.stringify(currentPlayers, null, 2));

        // Write to Client Public Data
        if (fs.existsSync(path.dirname(dataPathClient))) {
            fs.writeFileSync(dataPathClient, JSON.stringify(currentPlayers, null, 2));
        }

        return res.json({
            success: true,
            message: `Scraped successfully. Added ${newCount} new players, updated ${updateCount}.`,
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
