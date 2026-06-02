const fs = require('fs');
const path = require('path');

const imagePath = 'C:/Users/G Rohith Lakshman/.gemini/antigravity/brain/4841c78d-6b98-4c5e-b14f-5c3efab05daf/hb_company_logo_1780164209401.png';
const file = fs.readFileSync(imagePath);
const b64 = file.toString('base64');
fs.writeFileSync('src/lib/logoBase64.ts', `export const logoBase64 = 'data:image/png;base64,${b64}';\n`);
console.log('Logo converted successfully.');
