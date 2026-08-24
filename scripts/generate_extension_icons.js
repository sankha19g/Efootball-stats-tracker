const fs = require('fs');
const path = require('path');

// Simple PNG generator with eFootball accent (#00ff88) and dark background (#0a0a0c)
function createPngBuffer(width, height) {
    // 1x1 PNG or minimal valid PNG generator
    // Let's create an uncompressed RGBA PNG
    const zlib = require('zlib');

    function createChunk(type, data) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(data.length, 0);
        const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
        const crc = Buffer.alloc(4);
        const crcVal = require('zlib').crc32(typeAndData);
        crc.writeUInt32BE(crcVal, 0);
        return Buffer.concat([len, typeAndData, crc]);
    }

    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.writeUInt8(8, 8); // bit depth
    ihdr.writeUInt8(6, 9); // RGBA
    ihdr.writeUInt8(0, 10);
    ihdr.writeUInt8(0, 11);
    ihdr.writeUInt8(0, 12);
    const ihdrChunk = createChunk('IHDR', ihdr);

    // Image Data
    const rawRows = [];
    const radius = width / 2;
    const innerRadius = radius * 0.75;

    for (let y = 0; y < height; y++) {
        const row = [0]; // filter byte
        for (let x = 0; x < width; x++) {
            const dx = x - width / 2;
            const dy = y - height / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < innerRadius) {
                // Bright cyan/neon accent (#00ff88)
                row.push(0x00, 0xff, 0x88, 0xff);
            } else if (dist < radius) {
                // Dark border (#101418)
                row.push(0x10, 0x14, 0x18, 0xff);
            } else {
                // Transparent
                row.push(0x00, 0x00, 0x00, 0x00);
            }
        }
        rawRows.push(Buffer.from(row));
    }

    const rawData = Buffer.concat(rawRows);
    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const iconsDir = path.join(__dirname, '../extension/icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createPngBuffer(16, 16));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createPngBuffer(48, 48));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createPngBuffer(128, 128));

console.log('Icons generated successfully in extension/icons/');
