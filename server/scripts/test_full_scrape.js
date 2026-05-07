const axios = require('axios');
const cheerio = require('cheerio');

async function testFullScraper(url) {
    console.log('[Test] URL:', url);
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 10000
    });

    const $ = cheerio.load(data);
    const idMatch = url.match(/id=(\d+)/);
    const id = idMatch ? idMatch[1] : '';

    const player = {
        id,
        name: '',
        image: '',
        playstyle: 'None',
        skills: []
    };

    $('table.player th').each((idx, th) => {
        const headerText = $(th).text().trim().toLowerCase();
        const nextTd = $(th).next('td');
        const val = nextTd.text().trim();

        if (headerText.includes('player name')) player.name = val;
        
        if (headerText === 'playing style') {
            const nextRowText = $(th).parent().next('tr').find('td').text().trim();
            if (nextRowText) player.playstyle = nextRowText;
        }

        if (headerText.includes('player skills')) {
            $(th).parent().nextAll('tr').each((j, row) => {
                if ($(row).find('th').length > 0) return false;
                const skill = $(row).find('td').text().trim();
                if (skill) player.skills.push(skill);
            });
        }
    });

    $('img').each((i, img) => {
        const src = $(img).attr('src');
        if (src && (src.includes('img/card/') || src.includes('assets/img/card/'))) {
             let realImageUrl = src;
             if (!realImageUrl.startsWith('http')) {
                realImageUrl = 'https://pesdb.net' + (realImageUrl.startsWith('/') ? '' : '/') + realImageUrl;
             }
             if (realImageUrl.includes('/f') || !player.image) {
                player.image = realImageUrl;
                if (realImageUrl.includes('/f')) return false;
             }
        }
    });

    console.log('Final Result:', JSON.stringify(player, null, 2));
}

// Test with Messi again, but focus on playstyle accuracy
testFullScraper('https://pesdb.net/pes2022/?id=52895206764386');
