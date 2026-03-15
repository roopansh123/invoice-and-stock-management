#!/usr/bin/env node
/**
 * RFI Icon Generator
 * Generates PNG, ICO (Windows), and ICNS (macOS) icons
 * Run: node scripts/generate-icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const r = size * 0.12; // border radius approximation via clip

  // Background gradient (blue)
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1a56db');
  grad.addColorStop(1, '#1040b0');

  // Rounded rect clip
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.clip();

  // Shoe emoji approximation — draw "RFI" text
  const fontSize = size * 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RFI', size / 2, size / 2);

  // Subtle bottom text
  if (size >= 64) {
    const subSize = size * 0.11;
    ctx.font = `${subSize}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('FOOTWARE', size / 2, size * 0.75);
  }

  return canvas;
}

// Generate main 1024x1024 PNG
const sizes = [16, 32, 48, 64, 128, 256, 512, 1024];
console.log('Generating icons...');

sizes.forEach(size => {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const file = path.join(assetsDir, `icon-${size}.png`);
  fs.writeFileSync(file, buffer);
  console.log(`✅ Generated icon-${size}.png`);
});

// Copy 512 as main icon.png
fs.copyFileSync(
  path.join(assetsDir, 'icon-512.png'),
  path.join(assetsDir, 'icon.png')
);
console.log('✅ Copied icon.png (512px)');

console.log('\n📦 Icons generated in /assets/');
console.log('Next steps:');
console.log('  macOS: Convert icon-1024.png → icon.icns using script below');
console.log('  Windows: Convert icon-256.png → icon.ico using script below');
console.log('\nRun: node scripts/convert-icons.js');
