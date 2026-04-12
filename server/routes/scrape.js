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

// ─── Date extraction from PESDB player ID and URL ─────────────────────────────
// For featured/special cards the first 10 digits of the ID encode a Unix timestamp.
function extractDateFromId(id) {
    if (!id || id.length < 10) return '';
    const ts = parseInt(id.slice(0, 10), 10);
    if (isNaN(ts) || ts < 1000000000 || ts > 9999999999) return '';
    const d = new Date(ts * 1000);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

// Build a human-readable pack name from the PESDB featured URL slug.
// e.g. "potw-9-apr-26"         → "POTW 9 Apr '26"
//      "epic-j-league-apr-9-26" → "Epic J League 9 Apr '26"
//      "1760" (numeric)         → "" (no slug to parse)
function extractFeaturedFromUrl(url) {
    try {
        const u = new URL(url);
        const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5,
                         jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
        const MON_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

        // ── time_added param → just a date, no pack name ──
        const ta = u.searchParams.get('time_added');
        if (ta) {
            const d = new Date(parseInt(ta) * 1000);
            if (!isNaN(d.getTime()))
                return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
        }

        const feat = u.searchParams.get('featured') || '';
        // Skip pure numeric IDs (e.g. featured=1760)
        if (!feat || /^\d+$/.test(feat)) return '';

        // Try to find a date tail: -MMM-D-YY or -D-MMM-YY
        // e.g.  potw-9-apr-26  |  epic-j-league-apr-9-26  |  worldwide-9-apr-26
        const dateRe1 = /-(\d{1,2})-([a-z]{3})-(\d{2})$/i; // -9-apr-26
        const dateRe2 = /-([a-z]{3})-(\d{1,2})-(\d{2})$/i; // -apr-9-26

        let m = feat.match(dateRe1) || feat.match(dateRe2);
        let dateStr = '';
        let packSlug = feat;

        if (m) {
            // Determine which capture group is month vs day
            let mon, day, yr2;
            if (/^\d+$/.test(m[1])) { // -9-apr-26
                day = parseInt(m[1]); mon = m[2].toLowerCase(); yr2 = parseInt(m[3]);
            } else {                   // -apr-9-26
                mon = m[1].toLowerCase(); day = parseInt(m[2]); yr2 = parseInt(m[3]);
            }
            if (MONTHS[mon] !== undefined) {
                const monthName = MON_NAMES[MONTHS[mon]];
                dateStr = `${day} ${monthName} '${yr2.toString().padStart(2,'0')}`;
                // Strip the matched date tail from the slug to get the pack name part
                packSlug = feat.slice(0, feat.length - m[0].length);
            }
        }

        // Format the pack name: split by '-', capitalize known acronyms
        const ACRONYMS = new Set(['POTW','GK','J','MLS','UEFA','FIFA','LA','FC']);
        const packName = packSlug
            .split('-')
            .filter(Boolean)
            .map(w => {
                const upper = w.toUpperCase();
                return ACRONYMS.has(upper) ? upper : w.charAt(0).toUpperCase() + w.slice(1);
            })
            .join(' ');

        if (packName && dateStr) return `${packName} ${dateStr}`;
        if (packName) return packName;
        if (dateStr) return dateStr;
    } catch(_) {}
    return '';
}

// Fallback: decode date only from player ID first 10 digits.

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
        skills: [],
        height: '',
        weight: '',
        age: '',
        strongFoot: '',
        'Date Added': '',
        'Featured Players': '',
        'Weak Foot Usage': '',
        'Weak Foot Accuracy': '',
        'Form': '',
        'Injury Resistance': ''
    };

    // Extract basic info from table.player
    $('table.player th').each((idx, th) => {
        // Strip trailing colon — PESDB emits "Height:", "Age:", "Foot:" etc.
        const headerText = $(th).text().trim().toLowerCase().replace(/:$/, '').trim();
        const nextTd = $(th).next('td');
        const val = nextTd.text().trim();

        if (headerText.includes('player name')) player.name = val;
        if (headerText.includes('nationality')) player.nationality = val;
        if (headerText.includes('team name')) player.club = val;
        if (headerText.includes('league')) player.league = val;
        if (headerText.includes('position')) player.position = val;
        if (headerText.includes('overall rating')) player.rating = parseInt(val) || 0;

        // Physical Attributes
        if (headerText.includes('height')) player.height = parseInt(val) || val;
        if (headerText.includes('weight')) player.weight = parseInt(val) || val;
        if (headerText.includes('age') && !headerText.includes('usage')) player.age = parseInt(val) || val;
        if (headerText.includes('foot') && !headerText.includes('weak')) player.strongFoot = val;

        // Card / Pack Info
        if (headerText.includes('date added') || headerText.includes('release date')) player['Date Added'] = val;
        if (headerText.includes('featured') || headerText.includes('pack')) player['Featured Players'] = val;

        // Technical Attributes
        if (headerText.includes('weak foot usage') || headerText === 'weak foot use') player['Weak Foot Usage'] = val;
        if (headerText.includes('weak foot accuracy') || headerText === 'weak foot acc') player['Weak Foot Accuracy'] = val;
        if (headerText === 'form' || headerText.includes('condition') || headerText.includes('player form')) player['Form'] = val;
        if (headerText.includes('injury')) player['Injury Resistance'] = val;
        
        // ── Player Playing Style (exact match — must NOT match "ai playing style") ──
        if (headerText === 'playing style') {
            // PESDB: value is sometimes in the sibling td, sometimes in the next row
            if (val && val !== 'None' && val.length > 1) {
                player.playstyle = val;
            } else {
                const nextRowVal = $(th).parent().next('tr').find('td').first().text().trim();
                if (nextRowVal && nextRowVal.length > 1) player.playstyle = nextRowVal;
            }
        }

        // ── Featured Pack / Players ──
        if (headerText === 'featured players' || headerText === 'featured' || headerText === 'pack') {
            // Value is sometimes in sibling td, sometimes in the next row
            if (val && val.length > 1) {
                player['Featured Players'] = val;
            } else {
                const nextRowVal = $(th).parent().next('tr').find('td').first().text().trim();
                if (nextRowVal && nextRowVal.length > 1) player['Featured Players'] = nextRowVal;
            }
        }

        // ── Player Skills ──
        if (headerText.includes('player skills') || headerText === 'skills') {
            $(th).parent().nextAll('tr').each((j, row) => {
                const rowText = $(row).text().trim().toLowerCase();
                // Stop if we hit a new section (header or AI Playing Style)
                if ($(row).find('th').length > 0 || rowText.includes('ai playing style')) return false;
                
                // On PESDB, skills are in td. Some rows might have 2 tds (label: value) or just 1 (skill name)
                $(row).find('td').each((k, td) => {
                    const skill = $(td).text().trim();
                    if (skill && skill.length > 2 && !player.skills.includes(skill) && player.skills.length < 20) {
                        player.skills.push(skill);
                    }
                });
            });
        }
    });

    // Final check for skills in any table that looks like skills
    if (player.skills.length === 0) {
        $('th, td').each((i, el) => {
            const txt = $(el).text().trim().toLowerCase();
            if (txt === 'player skills' || txt === 'skills') {
                $(el).parent().nextAll('tr').slice(0, 15).each((j, row) => {
                    if ($(row).find('th').length > 0) return false;
                    const skill = $(row).find('td').first().text().trim();
                    if (skill && !player.skills.includes(skill)) player.skills.push(skill);
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
        if (src && (src.includes('img/card/') || src.includes('assets/img/card/'))) {
            let realImageUrl = src;
            if (!realImageUrl.startsWith('http')) {
                realImageUrl = realImageUrl.replace(/^\.\//, '');
                if (!realImageUrl.startsWith('/')) {
                    realImageUrl = '/' + realImageUrl;
                }
                realImageUrl = 'https://pesdb.net' + realImageUrl;
            }
            
            // Prioritize the front card image (starts with 'f')
            if (realImageUrl.includes('/f') || !player.image) {
                player.image = realImageUrl;
                if (realImageUrl.includes('/f')) return false; // Break if we found the front image
            }
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

            // Date Added: decode from player ID
            const dateAdded = extractDateFromId(id);
            // Featured Pack: parse from URL slug (e.g. "POTW 9 Apr '26")
            const featuredPack = extractFeaturedFromUrl(url);

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
                playstyle: 'None', // Requires individual page scraping
                skills: [],
                height: '', weight: '', age: '', strongFoot: '',
                'Date Added': dateAdded,
                'Featured Players': featuredPack,
                'Weak Foot Usage': '', 'Weak Foot Accuracy': '',
                'Form': '', 'Injury Resistance': ''
            });
        }
    });

    const urlObj = new URL(url);
    const baseUrl = urlObj.origin + urlObj.pathname;

    console.log(`[Scraper] Found ${scrapedPlayers.length} players. Fetching details using base: ${baseUrl}`);
 
     const BATCH_SIZE = 5;
     for (let i = 0; i < scrapedPlayers.length; i += BATCH_SIZE) {
         const batch = scrapedPlayers.slice(i, i + BATCH_SIZE);
         await Promise.all(batch.map(async (player) => {
             try {
                 const detailUrl = `${baseUrl}?id=${player.id}`;
                 const { data: detailData } = await axios.get(detailUrl, {
                     headers: {
                         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                     },
                     timeout: 8000
                 });
                 const detail$ = cheerio.load(detailData);
 
                 detail$('table.player th').each((idx, th) => {
                     // Strip trailing colon — PESDB emits "Height:", "Age:", "Foot:" etc.
                     const headerText = detail$(th).text().trim().toLowerCase().replace(/:$/, '').trim();
                     const val = detail$(th).next('td').text().trim();
 
                     // ── Player Playing Style (exact — excludes "ai playing style") ──
                     if (headerText === 'playing style') {
                        if (val && val !== 'None' && val.length > 1) {
                            player.playstyle = val;
                        } else {
                            const nextRowVal = detail$(th).parent().next('tr').find('td').first().text().trim();
                            if (nextRowVal && nextRowVal.length > 1) player.playstyle = nextRowVal;
                        }
                    }

                     if (headerText.includes('league')) player.league = val || 'Other';

                     // Physical
                     if (headerText.includes('height')) player.height = parseInt(val) || val;
                     if (headerText.includes('weight')) player.weight = parseInt(val) || val;
                     if (headerText.includes('age') && !headerText.includes('usage')) player.age = parseInt(val) || val;
                     if (headerText.includes('foot') && !headerText.includes('weak')) player.strongFoot = val;

                     // Card / Pack
                     if (headerText.includes('date added') || headerText.includes('release date')) player['Date Added'] = val;

                     // ── Featured Pack (exact — avoid matching random rows with 'featured') ──
                     if (headerText === 'featured players' || headerText === 'featured' || headerText === 'pack') {
                         if (val && val.length > 1) {
                             player['Featured Players'] = val;
                         } else {
                             const nextRowVal = detail$(th).parent().next('tr').find('td').first().text().trim();
                             if (nextRowVal && nextRowVal.length > 1) player['Featured Players'] = nextRowVal;
                         }
                     }

                     // Technical
                     if (headerText.includes('weak foot usage') || headerText === 'weak foot use') player['Weak Foot Usage'] = val;
                     if (headerText.includes('weak foot accuracy') || headerText === 'weak foot acc') player['Weak Foot Accuracy'] = val;
                     if (headerText === 'form' || headerText.includes('condition') || headerText.includes('player form')) player['Form'] = val;
                     if (headerText.includes('injury')) player['Injury Resistance'] = val;
                 });


                 // Fallback: derive Date Added from player ID if not found on page
                 if (!player['Date Added']) {
                     player['Date Added'] = extractDateFromId(player.id);
                 }

                 // Extract Skills in batch fetch
                 if (player.skills.length === 0) {
                     detail$('th, td').each((i, el) => {
                         const txt = detail$(el).text().trim().toLowerCase();
                         if (txt === 'player skills' || txt === 'skills' || txt.includes('player skills')) {
                             detail$(el).parent().nextAll('tr').each((j, row) => {
                                 const rowText = detail$(row).text().trim().toLowerCase();
                                 if (detail$(row).find('th').length > 0 || rowText.includes('ai playing style')) return false;
                                 
                                 detail$(row).find('td').each((k, td) => {
                                     const skill = detail$(td).text().trim();
                                     if (skill && skill.length > 2 && !player.skills.includes(skill) && player.skills.length < 20) {
                                         player.skills.push(skill);
                                     }
                                 });
                             });
                         }
                     });
                 }
 
                 // Extract accurate image
                 detail$('img').each((i, img) => {
                     const src = detail$(img).attr('src');
                     if (src && (src.includes('img/card/') || src.includes('assets/img/card/'))) {
                         let realImageUrl = src;
                         if (!realImageUrl.startsWith('http')) {
                             realImageUrl = realImageUrl.replace(/^\.\//, '');
                             if (!realImageUrl.startsWith('/')) {
                                 realImageUrl = '/' + realImageUrl;
                             }
                             realImageUrl = 'https://pesdb.net' + realImageUrl;
                         }
                         
                         // Prioritize front card image
                         if (realImageUrl.includes('/f') || !player.image) {
                            player.image = realImageUrl;
                            if (realImageUrl.includes('/f')) return false;
                         }
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
