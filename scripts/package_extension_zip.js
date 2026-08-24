const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const extChromeDir = path.join(__dirname, '../extension');
const extFirefoxDir = path.join(__dirname, '../extension-firefox');
const outDir = path.join(__dirname, '../client/public/downloads');

if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function getAllFiles(dir, base = '') {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = base ? `${base}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
            files = files.concat(getAllFiles(fullPath, relPath));
        } else {
            files.push({ name: relPath, fullPath });
        }
    }
    return files;
}

function createZipFile(files, outZipPath) {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const file of files) {
        const data = fs.readFileSync(file.fullPath);
        const nameBuffer = Buffer.from(file.name.replace(/\\/g, '/'), 'utf8');
        const uncompressedSize = data.length;

        const compressedData = zlib.deflateRawSync(data);
        const compressedSize = compressedData.length;

        const crc = crc32(data);

        // Local Header
        const localHeader = Buffer.alloc(30 + nameBuffer.length);
        localHeader.writeUInt32LE(0x04034b50, 0);
        localHeader.writeUInt16LE(20, 4);
        localHeader.writeUInt16LE(0, 6);
        localHeader.writeUInt16LE(8, 8);
        localHeader.writeUInt16LE(0, 10);
        localHeader.writeUInt16LE(0, 12);
        localHeader.writeUInt32LE(crc, 14);
        localHeader.writeUInt32LE(compressedSize, 18);
        localHeader.writeUInt32LE(uncompressedSize, 22);
        localHeader.writeUInt16LE(nameBuffer.length, 26);
        localHeader.writeUInt16LE(0, 28);
        nameBuffer.copy(localHeader, 30);

        localHeaders.push(localHeader, compressedData);

        // Central Directory Header
        const centralHeader = Buffer.alloc(46 + nameBuffer.length);
        centralHeader.writeUInt32LE(0x02014b50, 0);
        centralHeader.writeUInt16LE(20, 4);
        centralHeader.writeUInt16LE(20, 6);
        centralHeader.writeUInt16LE(0, 8);
        centralHeader.writeUInt16LE(8, 10);
        centralHeader.writeUInt16LE(0, 12);
        centralHeader.writeUInt16LE(0, 14);
        centralHeader.writeUInt32LE(crc, 16);
        centralHeader.writeUInt32LE(compressedSize, 20);
        centralHeader.writeUInt32LE(uncompressedSize, 24);
        centralHeader.writeUInt16LE(nameBuffer.length, 28);
        centralHeader.writeUInt16LE(0, 30);
        centralHeader.writeUInt16LE(0, 32);
        centralHeader.writeUInt16LE(0, 34);
        centralHeader.writeUInt16LE(0, 36);
        centralHeader.writeUInt32LE(0, 38);
        centralHeader.writeUInt32LE(offset, 42);
        nameBuffer.copy(centralHeader, 46);

        centralHeaders.push(centralHeader);

        offset += localHeader.length + compressedData.length;
    }

    const centralDirectoryOffset = offset;
    const centralDirectorySize = centralHeaders.reduce((acc, h) => acc + h.length, 0);

    // End of Central Directory
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(centralDirectorySize, 12);
    eocd.writeUInt32LE(centralDirectoryOffset, 16);
    eocd.writeUInt16LE(0, 20);

    const fullZip = Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
    fs.writeFileSync(outZipPath, fullZip);
}

function crc32(buf) {
    let table = [];
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        table[i] = c >>> 0;
    }

    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}

// 1. Chrome / Edge / Brave / Kiwi
const chromeFiles = getAllFiles(extChromeDir).filter(f => f.name !== 'manifest-firefox.json');
const zipPathChrome = path.join(outDir, 'efootball-extension.zip');
createZipFile(chromeFiles, zipPathChrome);
console.log(`Zipped Chrome extension: ${zipPathChrome} (${fs.statSync(zipPathChrome).size} bytes)`);

// 2. Firefox
const firefoxFiles = getAllFiles(extFirefoxDir);
const zipPathFirefox = path.join(outDir, 'efootball-extension-firefox.zip');
createZipFile(firefoxFiles, zipPathFirefox);
console.log(`Zipped Firefox extension: ${zipPathFirefox} (${fs.statSync(zipPathFirefox).size} bytes)`);
