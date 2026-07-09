import sharp from 'sharp';
import fs from 'fs';

async function convert() {
  try {
    await sharp('./public/tripgod-logo.svg')
      .png()
      .toFile('./public/tripgod-logo.png');
    console.log('Successfully compiled tripgod-logo.png from SVG!');
  } catch (err) {
    console.error('Failed to convert logo:', err);
  }
}

convert();
