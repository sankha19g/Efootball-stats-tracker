const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../extension');
const destDir = path.join(__dirname, '../extension-firefox');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy icons
const iconsDest = path.join(destDir, 'icons');
if (!fs.existsSync(iconsDest)) {
    fs.mkdirSync(iconsDest, { recursive: true });
}

// Copy all assets
['background.js', 'content.js', 'content.css', 'popup.html', 'popup.css', 'popup.js'].forEach(file => {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
});

['icon16.png', 'icon48.png', 'icon128.png'].forEach(file => {
    fs.copyFileSync(path.join(srcDir, 'icons', file), path.join(iconsDest, file));
});

// Copy manifest-firefox.json as manifest.json in extension-firefox
fs.copyFileSync(path.join(srcDir, 'manifest-firefox.json'), path.join(destDir, 'manifest.json'));

console.log('✅ Created extension-firefox folder with Firefox-ready manifest.json');
