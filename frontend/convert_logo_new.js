import fs from 'fs';
const file = fs.readFileSync('public/circular_logo.png');
const b64 = file.toString('base64');
fs.writeFileSync('src/lib/logoBase64.ts', `export const logoBase64 = 'data:image/png;base64,${b64}';\n`);
console.log('Circular Logo converted successfully.');
