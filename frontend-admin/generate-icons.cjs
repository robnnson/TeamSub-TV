// Simple icon generator for PWA - development only
// For production, use actual high-quality logo

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size
sizes.forEach(size => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">T</text>
</svg>`;

  // For now, just save as SVG (browsers will handle it)
  // In production, you would convert to PNG
  const filename = path.join(iconsDir, `icon-${size}x${size}.png`);

  // Write a simple text file indicating the icon needs to be created
  fs.writeFileSync(
    filename.replace('.png', '.svg'),
    svg
  );

  console.log(`Generated icon-${size}x${size}.svg`);
});

console.log('\nPlaceholder SVG icons created!');
console.log('For production, replace with actual PNG icons.');
console.log('You can convert SVGs to PNGs using online tools or ImageMagick.');
