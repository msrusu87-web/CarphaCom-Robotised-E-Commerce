const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, 'public', 'icons');

async function generateIcons() {
  for (const size of sizes) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6"/>
            <stop offset="100%" style="stop-color:#8b5cf6"/>
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
        <text x="${size/2}" y="${size * 0.65}" font-family="Arial, sans-serif" font-size="${size * 0.45}" font-weight="bold" fill="white" text-anchor="middle">CC</text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));

    console.log(`Generated icon-${size}.png`);
  }
  console.log('All icons generated!');
}

generateIcons().catch(console.error);
