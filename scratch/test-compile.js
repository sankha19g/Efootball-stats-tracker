const fs = require('fs');
const path = require('path');

const parserPath = path.resolve(__dirname, '../client/node_modules/@babel/parser');
const parser = require(parserPath);

try {
  const filePath = path.resolve(__dirname, '../client/src/components/ScreenshotsModal.jsx');
  const code = fs.readFileSync(filePath, 'utf-8');
  console.log('Parsing with @babel/parser:', filePath);
  const result = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Babel parser succeeded!');
} catch (e) {
  console.error('Babel parser failed:');
  console.error(e.message);
}
