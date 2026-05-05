const fs = require('fs');
const content = fs.readFileSync('c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker/client/src/components/ComparePlayers.jsx', 'utf8');
const lines = content.split('\n');
let stack = [];
lines.forEach((line, i) => {
    const opens = line.match(/<div(?!\/)/g) || [];
    const closes = line.match(/<\/div>/g) || [];
    opens.forEach(() => stack.push(i + 1));
    closes.forEach(() => {
        if (stack.length === 0) {
            console.log(`Extra closing div at line ${i + 1}`);
        } else {
            stack.pop();
        }
    });
});
if (stack.length > 0) {
    console.log(`Unclosed divs started at lines: ${stack.join(', ')}`);
} else {
    console.log('All divs balanced');
}
