const fs = require('fs');
const path = require('path');

const root = 'c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker';
const clientSrc = path.join(root, 'client/src');
const componentsDir = path.join(clientSrc, 'components');
const pagesDir = path.join(clientSrc, 'pages');
const configDir = path.join(clientSrc, 'config');
const firebaseDir = path.join(clientSrc, 'firebase');

// 1. Create directories
[pagesDir, firebaseDir, path.join(root, 'scripts'), path.join(root, 'server/logs'), path.join(root, 'server/scripts')].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 2. Move pages
const pageFiles = [
    'MySquadDB.jsx', 
    'Leaderboard.jsx', 
    'ActivityLog.jsx', 
    'BadgesView.jsx', 
    'ComparePlayers.jsx', 
    'DatabasePlayerList.jsx', 
    'SquadBuilder.jsx'
];

pageFiles.forEach(file => {
    const oldPath = path.join(componentsDir, file);
    const newPath = path.join(pagesDir, file);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log('Moved', file, 'to pages');
    }
});

// 3. Move firebase
if (fs.existsSync(path.join(configDir, 'firebase.js'))) {
    fs.renameSync(path.join(configDir, 'firebase.js'), path.join(firebaseDir, 'firebase.js'));
    console.log('Moved firebase.js to firebase/');
}

// Update App.jsx and other files for page moves and firebase move
function updateImports(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            updateImports(filePath);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            let content = fs.readFileSync(filePath, 'utf8');
            let originalContent = content;

            // Fix page imports in App.jsx
            if (file === 'App.jsx') {
                pageFiles.forEach(pf => {
                    const name = pf.replace('.jsx', '');
                    const regex = new RegExp(`from\\s+['"]\\.\\/components\\/${name}['"]`, 'g');
                    content = content.replace(regex, `from './pages/${name}'`);
                });
            }

            // Fix imports inside the moved pages
            if (dir === pagesDir) {
                // If it imports from './Component' and Component is NOT a page, it's now '../components/Component'
                content = content.replace(/from\s+['"]\.\/([^'"]+)['"]/g, (match, p1) => {
                    const isPage = pageFiles.some(pf => pf.replace('.jsx', '') === p1);
                    if (isPage) {
                        return `from './${p1}'`;
                    }
                    return `from '../components/${p1}'`;
                });
            }

            // Fix firebase imports globally in client/src
            content = content.replace(/config\/firebase/g, 'firebase/firebase');

            if (content !== originalContent) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Updated imports in', filePath);
            }
        }
    }
}
updateImports(clientSrc);

// 4. Organize root scripts
['fix_jsx.js', 'fix_jsx_v2.js'].forEach(file => {
    const p = path.join(root, file);
    if (fs.existsSync(p)) {
        fs.renameSync(p, path.join(root, 'scripts', file));
        console.log('Moved', file, 'to scripts/');
    }
});

// 5. Organize server
const serverDir = path.join(root, 'server');
const serverLogsDir = path.join(serverDir, 'logs');
const serverScriptsDir = path.join(serverDir, 'scripts');

fs.readdirSync(serverDir).forEach(file => {
    const p = path.join(serverDir, file);
    if (!fs.statSync(p).isFile()) return;
    
    if (file.endsWith('.txt')) {
        fs.renameSync(p, path.join(serverLogsDir, file));
        console.log('Moved', file, 'to server/logs/');
    } else if ((file.startsWith('test_') || file.startsWith('debug_')) && file.endsWith('.js')) {
        fs.renameSync(p, path.join(serverScriptsDir, file));
        console.log('Moved', file, 'to server/scripts/');
    } else if (file === 'test_scrape.json') {
        fs.renameSync(p, path.join(serverDir, 'data', 'test_scrape.json'));
        console.log('Moved test_scrape.json to server/data/');
    }
});

console.log('Done organizing!');
