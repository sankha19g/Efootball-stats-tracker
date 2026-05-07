const axios = require('axios');
const cheerio = require('cheerio');

async function testFetchDetail() {
    try {
        const { data } = await axios.get('https://pesdb.net/pes2022/?id=52895206764386');
        const $ = cheerio.load(data);

        let imageUrl = '';
        $('img').each((i, img) => {
            const src = $(img).attr('src');
            if (src && src.includes('img/card/')) {
                imageUrl = src;
                return false; // Break loop
            }
        });

        console.log(`First image found: ${imageUrl}`);
    } catch (err) {
        console.error(err.message);
    }
}

testFetchDetail();
