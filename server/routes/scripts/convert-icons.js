#!/usr/bin/env node
/**
 * Convert PNG icons to ICNS (macOS) and ICO (Windows)
 * Run: node scripts/convert-icons.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const assets = path.join(__dirname, '../assets');

// ─── macOS ICNS ───────────────────────────────────────────────────────────────
function buildICNS() {
  console.log('Building ICNS for macOS...');
  const iconsetDir = path.join(assets, 'icon.iconset');
  if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir);

  const iconsetSizes = [
    { size: 16, name: 'icon_16x16.png' },
    { size: 32, name: 'icon_16x16@2x.png' },
    { size: 32, name: 'icon_32x32.png' },
    { size: 64, name: 'icon_32x32@2x.png' },
    { size: 128, name: 'icon_128x128.png' },
    { size: 256, name: 'icon_128x128@2x.png' },
    { size: 256, name: 'icon_256x256.png' },
    { size: 512, name: 'icon_256x256@2x.png' },
    { size: 512, name: 'icon_512x512.png' },
    { size: 1024, name: 'icon_512x512@2x.png' },
  ];

  iconsetSizes.forEach(({ size, name }) => {
    const src = path.join(assets, `icon-${size}.png`);
    const dest = path.join(iconsetDir, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });

  // Use macOS iconutil if available
  try {
    execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(assets, 'icon.icns')}"`, { stdio: 'inherit' });
    console.log('✅ icon.icns created');
    fs.rmSync(iconsetDir, { recursive: true });
  } catch {
    console.log('⚠️  iconutil not available (only on macOS). ICNS will be skipped on non-Mac.');
    console.log('   When building on Mac, run this script again.');
    // Fallback: copy the largest PNG as placeholder
    fs.copyFileSync(path.join(assets, 'icon-512.png'), path.join(assets, 'icon.icns'));
  }
}

// ─── Windows ICO ─────────────────────────────────────────────────────────────
function buildICO() {
  console.log('Building ICO for Windows...');
  try {
    // Try using png-to-ico if installed
    execSync('npx png-to-ico --version', { stdio: 'ignore' });
    const sizes = [16, 32, 48, 64, 128, 256];
    const inputs = sizes.map(s => path.join(assets, `icon-${s}.png`)).filter(fs.existsSync).join(' ');
    execSync(`npx png-to-ico ${inputs} > "${path.join(assets, 'icon.ico')}"`, { stdio: 'inherit' });
    console.log('✅ icon.ico created');
  } catch {
    // Fallback: copy 256px PNG as ICO placeholder (electron-builder handles conversion)
    fs.copyFileSync(path.join(assets, 'icon-256.png'), path.join(assets, 'icon.ico'));
    console.log('✅ icon.ico created (from 256px PNG — electron-builder will handle conversion)');
  }
}

buildICNS();
buildICO();

console.log('\n✅ All icons ready in /assets/');
console.log('  icon.png  — general use');
console.log('  icon.icns — macOS DMG');
console.log('  icon.ico  — Windows EXE');
