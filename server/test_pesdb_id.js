const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeDetails(id) {
    const url = `https://pesdb.net/efootball/?id=${id}`;
    console.log(`Testing URL: ${url}`);
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const info = {};

        $('tr').each((i, tr) => {
            const text = $(tr).text().trim();
            // console.log(`Row ${i}: ${text}`);
            if (text.startsWith('Height:')) info.height = text.replace('Height:', '').trim();
            if (text.startsWith('Age:')) info.age = text.replace('Age:', '').trim();
            if (text.startsWith('Foot:')) info.foot = text.replace('Foot:', '').trim();
        });

        console.log('Result:', info);
        return info;
    } catch (err) {
        console.error('Error:', err.message);
        return null;
    }
}

// Test with Wesley Saïd (ID: 52898159455277 from the user's file)
scrapeDetails('52898159455277');
