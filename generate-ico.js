import fs from 'fs';
import path from 'path';

const pngPath = './public/favicon-48x48.png';
const icoPath = './public/favicon.ico';

function convertPngToIco() {
  try {
    const pngBuffer = fs.readFileSync(pngPath);
    
    const header = Buffer.alloc(22);
    
    // ICONDIR Header (6 bytes)
    header.writeUInt16LE(0, 0);   // Reserved
    header.writeUInt16LE(1, 2);   // Image type (1 = icon)
    header.writeUInt16LE(1, 4);   // Number of images
    
    // ICONDIRENTRY (16 bytes)
    header.writeUInt8(48, 6);     // Width (48)
    header.writeUInt8(48, 7);     // Height (48)
    header.writeUInt8(0, 8);      // Color palette (0 = no palette)
    header.writeUInt8(0, 9);      // Reserved
    header.writeUInt16LE(1, 10);  // Color planes (1)
    header.writeUInt16LE(32, 12); // Bits per pixel (32)
    header.writeUInt32LE(pngBuffer.length, 14); // Size of image data
    header.writeUInt32LE(22, 18); // Offset of image data (header size)
    
    const icoBuffer = Buffer.concat([header, pngBuffer]);
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`Successfully created valid favicon.ico at ${icoPath}`);
  } catch (err) {
    console.error('Error generating favicon.ico:', err);
  }
}

convertPngToIco();
