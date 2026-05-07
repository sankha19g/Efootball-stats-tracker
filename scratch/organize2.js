const fs = require('fs');
const path = require('path');

const root = 'c:/Users/ADMIN/Documents/GitHub/Efootball-stats-tracker';

// 1. Organize Firebase files
const firebaseDir = path.join(root, 'firebase');
if (!fs.existsSync(firebaseDir)) {
    fs.mkdirSync(firebaseDir);
}

const firebaseFiles = ['firestore.rules', 'firestore.indexes.json', 'storage.rules'];
firebaseFiles.forEach(file => {
    const oldPath = path.join(root, file);
    const newPath = path.join(firebaseDir, file);
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log('Moved', file, 'to firebase/');
    }
});

// Update firebase.json
const firebaseJsonPath = path.join(root, 'firebase.json');
if (fs.existsSync(firebaseJsonPath)) {
    let content = fs.readFileSync(firebaseJsonPath, 'utf8');
    content = content.replace(/"firestore\.rules"/g, '"firebase/firestore.rules"');
    content = content.replace(/"firestore\.indexes\.json"/g, '"firebase/firestore.indexes.json"');
    content = content.replace(/"storage\.rules"/g, '"firebase/storage.rules"');
    fs.writeFileSync(firebaseJsonPath, content);
    console.log('Updated firebase.json');
}

// 2. Organize soccer_leagues.json
const clientDir = path.join(root, 'client');
const clientDataDir = path.join(clientDir, 'src', 'data');
if (!fs.existsSync(clientDataDir)) {
    fs.mkdirSync(clientDataDir, { recursive: true });
}

const soccerPath = path.join(clientDir, 'soccer_leagues.json');
if (fs.existsSync(soccerPath)) {
    fs.renameSync(soccerPath, path.join(clientDataDir, 'soccer_leagues.json'));
    console.log('Moved soccer_leagues.json to client/src/data/');
}

// 3. Move check-error.cjs
const clientScriptsDir = path.join(clientDir, 'scripts');
if (!fs.existsSync(clientScriptsDir)) {
    fs.mkdirSync(clientScriptsDir);
}

const checkErrorPath = path.join(clientDir, 'check-error.cjs');
if (fs.existsSync(checkErrorPath)) {
    fs.renameSync(checkErrorPath, path.join(clientScriptsDir, 'check-error.cjs'));
    console.log('Moved check-error.cjs to client/scripts/');
}

// 4. Move SETUP_FIREBASE.md to docs
const docsDir = path.join(root, 'docs');
if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir);
}

const setupFirebasePath = path.join(clientDir, 'SETUP_FIREBASE.md');
if (fs.existsSync(setupFirebasePath)) {
    fs.renameSync(setupFirebasePath, path.join(docsDir, 'SETUP_FIREBASE.md'));
    console.log('Moved SETUP_FIREBASE.md to docs/');
}
