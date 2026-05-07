const fs = require('fs');
let appJsx = fs.readFileSync('c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker/client/src/App.jsx', 'utf8');
const pageFiles = ['MySquadDB', 'Leaderboard', 'ActivityLog', 'BadgesView', 'ComparePlayers', 'DatabasePlayerList', 'SquadBuilder'];
pageFiles.forEach(name => {
    appJsx = appJsx.replace(new RegExp(`import\\(['"\`]\\.\\/components\\/${name}['"\`]\\)`, 'g'), `import('./pages/${name}')`);
});
fs.writeFileSync('c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker/client/src/App.jsx', appJsx);
console.log('App.jsx updated');
