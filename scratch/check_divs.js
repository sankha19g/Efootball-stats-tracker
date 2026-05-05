const fs = require('fs');
const content = fs.readFileSync('c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker/client/src/components/ComparePlayers.jsx', 'utf8');

let divCount = 0;
const lines = content.split('\n');
lines.forEach((line, i) => {
    const opens = (line.match(/<div/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    divCount += opens;
    divCount -= closes;
    if (divCount < 0) {
        console.log(`Line ${i + 1}: Extra closing div! (Current count: ${divCount})`);
        divCount = 0; // reset to keep going
    }
});

console.log(`Final div count: ${divCount}`);
