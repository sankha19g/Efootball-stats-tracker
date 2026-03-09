const fs = require('fs');
const path = require('path');

const sourcePath = 'C:\\Users\\ADMIN\\Downloads\\pesapi-master\\pesapi-master\\scraper\\pesdb_featured_players\\pesdb_featured_players_20260213_192931.json';
const targetPath = 'c:\\Users\\ADMIN\\Downloads\\efootball\\server\\data\\pesdb_players.json';

try {
    console.log('Reading source file...');
    const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

    console.log('Reading target file...');
    const targetData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

    console.log(`Mapping playstyles for ${sourceData.length} source players...`);
    const playstyleMap = new Map();
    sourceData.forEach(player => {
        if (player.id && player.playstyle) {
            playstyleMap.set(player.id, player.playstyle);
        }
    });

    console.log(`Updating ${targetData.length} target players...`);
    let updatedCount = 0;
    targetData.forEach(player => {
        if (playstyleMap.has(player.id)) {
            player.playstyle = playstyleMap.get(player.id);
            updatedCount++;
        }
    });

    console.log(`Finished updating. ${updatedCount} players updated with playstyles.`);

    console.log('Writing updated target file...');
    fs.writeFileSync(targetPath, JSON.stringify(targetData, null, 2));

    console.log('Process completed successfully.');
} catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
}
