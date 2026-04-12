const axios = require('axios');
const cheerio = require('cheerio');

async function dumpTable(url) {
    console.log('\n[Debug] URL:', url);
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        timeout: 12000
    });
    const $ = cheerio.load(data);

    console.log('\n=== ALL TABLE ROWS (table.player) with index ===');
    $('table.player tr').each((i, row) => {
        const th = $(row).find('th').map((_, el) => `"${$(el).text().trim()}"`).get().join(', ');
        const td = $(row).find('td').map((_, el) => `"${$(el).text().trim().slice(0, 60)}"`).get().join(', ');
        console.log(`  Row ${i}: TH=[${th}]  TD=[${td}]`);
    });

    console.log('\n=== ALL TABLE ROWS (all tables) containing "style" or "featured" or "pack" ===');
    $('tr').each((i, row) => {
        const txt = $(row).text().replace(/\s+/g, ' ').trim();
        if (/style|featured|pack|added|date/i.test(txt)) {
            console.log(`  Row ${i}: "${txt.slice(0, 120)}"`);
        }
    });

    console.log('\n=== Raw table.player HTML (first 4000 chars) ===');
    console.log($('table.player').first().html()?.slice(0, 4000) || 'NOT FOUND');
}

// Try a featured player
dumpTable('https://pesdb.net/pes2022/?id=52895206764386').catch(e => console.error(e.message));
