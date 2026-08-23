import fs from 'fs';
const file = fs.readFileSync('public/exact_logo_2.jpg');
const b64 = file.toString('base64');
fs.writeFileSync('src/lib/logoBase64.ts', `export const logoBase64 = 'data:image/jpeg;base64,${b64}';\n`);
console.log('Latest Logo converted successfully.');
