async function check() {
    const url = 'https://pesdb.net/efootball/?all=1&columns=s01,s02,s13,s25';
    const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" }
    });
    const html = await response.text();
    console.log(html.substring(0, 10000));
}
check();
