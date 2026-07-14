import fs from 'fs';
const content = fs.readFileSync('scratch/live_bundle.js', 'utf8');
const idx = content.indexOf("eyJhbGci");
if (idx !== -1) {
  console.log("FOUND AT", idx, content.substring(idx, idx + 250));
} else {
  console.log("NOT FOUND");
}
