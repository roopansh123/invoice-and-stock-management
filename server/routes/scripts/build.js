#!/usr/bin/env node
/**
 * RFI Management — Production Build Script
 * Run: node scripts/build.js
 * 
 * Creates:
 *   dist/RFI Management-1.0.0.dmg  (macOS)
 *   dist/RFI Management Setup.exe   (Windows)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

function run(cmd, cwd = ROOT) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function checkPrereqs() {
  console.log('\n🔍 Checking prerequisites...');

  // Node version
  const nodeVer = process.version;
  console.log(`  Node.js: ${nodeVer}`);

  // Check assets exist
  const requiredAssets = ['icon.png'];
  const missing = requiredAssets.filter(f => !fs.existsSync(path.join(ASSETS, f)));
  if (missing.length > 0) {
    console.log('  ⚠️  Missing icons — generating...');
    // Create placeholder icons using built-in Node (no canvas dependency)
    createPlaceholderIcons();
  } else {
    console.log('  ✅ Icons found');
  }

  // Check client/build
  if (!fs.existsSync(path.join(ROOT, 'client/build'))) {
    console.log('  ⚠️  React build not found — will build now');
  } else {
    console.log('  ✅ React build found');
  }
}

function createPlaceholderIcons() {
  // Create minimal 1x1 transparent PNG as placeholder
  // Actual icons should be replaced by the user
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

  // Minimal valid PNG (1x1 blue pixel)
  const png1x1 = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
    '2e00000000c494441540x789c6260f8cfc0000000020001e221bc33000000' +
    '0049454e44ae426082', 'hex'
  );

  // Write a basic SVG icon and convert hint
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a56db"/>
      <stop offset="100%" style="stop-color:#1040b0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#g)"/>
  <text x="256" y="300" font-family="Arial" font-size="180" font-weight="900" 
        fill="white" text-anchor="middle">RFI</text>
  <text x="256" y="380" font-family="Arial" font-size="60" 
        fill="rgba(255,255,255,0.6)" text-anchor="middle">FOOTWARE</text>
</svg>`;

  fs.writeFileSync(path.join(ASSETS, 'icon.svg'), svg);
  console.log('  ✅ Created icon.svg');

  // Try to convert SVG to PNG using sharp or Inkscape if available
  try {
    execSync('which inkscape', { stdio: 'ignore' });
    execSync(`inkscape "${path.join(ASSETS, 'icon.svg')}" --export-png="${path.join(ASSETS, 'icon.png')}" --export-width=512`, { stdio: 'ignore' });
    console.log('  ✅ Converted to icon.png via Inkscape');
  } catch {
    try {
      execSync(`npx sharp-cli -i "${path.join(ASSETS, 'icon.svg')}" -o "${path.join(ASSETS, 'icon.png')}"`, { stdio: 'ignore' });
    } catch {
      // Manual fallback — create a simple PNG
      console.log('  ℹ️  Please manually add a 512x512 PNG as assets/icon.png');
      // Write a minimal PNG placeholder
      const { createCanvas } = (() => { try { return require('canvas'); } catch { return null; } })() || {};
      if (createCanvas) {
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 512, 512);
        grad.addColorStop(0, '#1a56db');
        grad.addColorStop(1, '#1040b0');
        ctx.fillStyle = grad;
        ctx.roundRect(0, 0, 512, 512, 80);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 180px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('RFI', 256, 300);
        ctx.font = '60px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('FOOTWARE', 256, 380);
        fs.writeFileSync(path.join(ASSETS, 'icon.png'), canvas.toBuffer('image/png'));
        console.log('  ✅ Generated icon.png via canvas');
      }
    }
  }

  // ICNS (macOS)
  try {
    const iconsetDir = path.join(ASSETS, 'icon.iconset');
    if (!fs.existsSync(iconsetDir)) fs.mkdirSync(iconsetDir);
    if (fs.existsSync(path.join(ASSETS, 'icon.png'))) {
      const sizes = [[16,'16x16'],[32,'16x16@2x'],[32,'32x32'],[64,'32x32@2x'],[128,'128x128'],[256,'128x128@2x'],[256,'256x256'],[512,'256x256@2x'],[512,'512x512'],[1024,'512x512@2x']];
      sizes.forEach(([s, name]) => {
        try { execSync(`sips -z ${s} ${s} "${path.join(ASSETS,'icon.png')}" --out "${path.join(iconsetDir,'icon_'+name+'.png')}"`, {stdio:'ignore'}); } catch {}
      });
      execSync(`iconutil -c icns "${iconsetDir}" -o "${path.join(ASSETS,'icon.icns')}"`, {stdio:'ignore'});
      fs.rmSync(iconsetDir, { recursive: true, force: true });
      console.log('  ✅ Generated icon.icns');
    }
  } catch { 
    // Copy PNG as placeholder
    if (fs.existsSync(path.join(ASSETS, 'icon.png'))) {
      fs.copyFileSync(path.join(ASSETS, 'icon.png'), path.join(ASSETS, 'icon.icns'));
    }
    console.log('  ℹ️  ICNS placeholder created (run on macOS for proper ICNS)');
  }

  // ICO (Windows) — copy PNG as placeholder
  if (fs.existsSync(path.join(ASSETS, 'icon.png'))) {
    fs.copyFileSync(path.join(ASSETS, 'icon.png'), path.join(ASSETS, 'icon.ico'));
    console.log('  ✅ Generated icon.ico (placeholder)');
  }
}

function buildReact() {
  console.log('\n⚛️  Building React app...');
  run('npm run build', path.join(ROOT, 'client'));
  console.log('✅ React build complete');
}

function buildElectron(platform) {
  console.log(`\n📦 Building Electron for ${platform}...`);
  const flag = platform === 'mac' ? '--mac --config.mac.identity=null' : platform === 'win' ? '--win' : '--linux';
  run(`npx electron-builder ${flag}`, ROOT);
}

function printSummary() {
  const distDir = path.join(ROOT, 'dist');
  if (!fs.existsSync(distDir)) return;
  const files = fs.readdirSync(distDir).filter(f => 
    f.endsWith('.dmg') || f.endsWith('.exe') || f.endsWith('.AppImage')
  );
  console.log('\n🎉 BUILD COMPLETE!');
  console.log('═'.repeat(50));
  console.log('📁 Output files:');
  files.forEach(f => {
    const size = (fs.statSync(path.join(distDir, f)).size / 1024 / 1024).toFixed(1);
    console.log(`   dist/${f} (${size} MB)`);
  });
  console.log('═'.repeat(50));
  console.log('\n📋 Distribution Notes:');
  console.log('  macOS: Share the .dmg file — users drag app to Applications');
  console.log('  Windows: Share the Setup.exe — double-click to install');
  console.log('\n⚠️  IMPORTANT: Users need MongoDB installed!');
  console.log('   See README.md for MongoDB installation instructions');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const arg = process.argv[2] || 'mac';
console.log('🥾 RFI Management — Production Build');
console.log('=====================================');

checkPrereqs();
buildReact();
buildElectron(arg);
printSummary();
