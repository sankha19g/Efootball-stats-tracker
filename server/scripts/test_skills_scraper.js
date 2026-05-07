/**
 * Quick test: fetch efootball-world.com player page and parse skills
 * Uses https module with custom TLS to bypass basic bot detection
 */
const https = require('https');
const cheerio = require('cheerio');

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'max-age=0',
            },
            timeout: 15000
        };

        let rawData = [];
        const req = https.get(url, options, (res) => {
            console.log('Status:', res.statusCode);
            
            // Handle gzip/br/deflate
            let stream = res;
            const encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createGunzip());
            } else if (encoding === 'br') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createBrotliDecompress());
            } else if (encoding === 'deflate') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createInflate());
            }

            stream.on('data', chunk => rawData.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(rawData).toString('utf8')));
            stream.on('error', reject);
        });
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.on('error', reject);
    });
}

const SKILL_BLACKLIST = new Set([
    'Player Skills', 'AI Playing Styles', 'SHT', 'PAS', 'DRI', 'DEX', 'LBS',
    'AER', 'DEF', 'GK1', 'Menu', 'Max', 'AMF', 'CF', 'GK', 'CB', 'LB', 'RB',
    'CMF', 'DMF', 'LMF', 'RMF', 'AMF', 'SS', 'LWF', 'RWF', 'ATTACKING',
    'DEFENDING', 'ATHLETICISM', 'CONDITIONS', 'Comments', '0', '1', '2'
]);

function parseSkills(html) {
    const $ = cheerio.load(html);
    const skills = [];
    let inSkillSection = false;
    let skipAISection = false;

    $('*').each((i, el) => {
        // Only leaf text nodes
        if ($(el).children().length > 0) return;
        const text = $(el).text().trim();
        if (!text || text.length > 60) return;

        if (text === 'Player Skills') { inSkillSection = true; return; }
        if (text === 'AI Playing Styles') { skipAISection = true; return; }

        // Stop when we leave the skills area (stat labels start appearing)
        if (['SHT', 'PAS', 'DRI', 'DEX', 'LBS', 'AER', 'DEF', 'GK1'].includes(text)) {
            inSkillSection = false;
            return;
        }

        if (inSkillSection && !skipAISection && !SKILL_BLACKLIST.has(text)) {
            skills.push(text);
        }
        // After AI Playing Styles block ends (detected by stat line), reset
    });

    return skills;
}

async function main() {
    const id = '52898159455277'; // Wesley Said
    const url = `https://efootball-world.com/player/${id}`;
    console.log('Fetching:', url);
    try {
        const html = await fetchPage(url);
        console.log('Page length:', html.length, 'bytes');
        const skills = parseSkills(html);
        console.log('Skills found:', skills);
    } catch (e) {
        console.error('Error:', e.message || e);
    }
}

main();
