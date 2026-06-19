import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = './public/favicon.svg';
const outputDir = './public';

// Google Search Favicon Guidelines: must be a multiple of 48px square
const sizes = [48, 96, 144, 192, 512];

async function generateFavicons() {
  try {
    const svgBuffer = fs.readFileSync(svgPath);

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `favicon-${size}x${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated: ${outputPath}`);
    }

    // Generate main favicon.png at 192x192
    const mainFaviconPng = path.join(outputDir, 'favicon.png');
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(mainFaviconPng);
    console.log(`Generated: ${mainFaviconPng}`);

    // Also generate a favicon.ico at 48x48
    const faviconIco = path.join(outputDir, 'favicon.ico');
    await sharp(svgBuffer)
      .resize(48, 48)
      .toFormat('ico')
      .toFile(faviconIco);
    console.log(`Generated: ${faviconIco}`);

    console.log('All favicons generated successfully!');
  } catch (err) {
    console.error('Error generating favicons:', err);
  }
}

generateFavicons();
