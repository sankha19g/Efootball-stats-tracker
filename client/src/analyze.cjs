const fs = require('fs');
const html = fs.readFileSync('efootballdb.html', 'utf8');
const classes = new Set();
const regex = /class="([^"]*layer[^"]*)"/gi;
let match;
while ((match = regex.exec(html)) !== null) {
    classes.add(match[1]);
}
console.log(Array.from(classes));

const cardRegex = /<div [^>]*class="([^"]*PlayerCard_cardContainer[^"]*)"[\s\S]*?(<\/div>){5,}/i;
const cardMatch = html.match(cardRegex);
if (cardMatch) {
    console.log("Found card structure snippet:\n", cardMatch[0].substring(0, 1000));
}
