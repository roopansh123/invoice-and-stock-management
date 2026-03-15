# 🥾 RFI Management — Build Guide
## How to Create DMG (macOS) and EXE (Windows) Installers

---

## ⚡ Quick Build (3 commands)

```bash
cd ~/Documents/rfi-app
npm install
npm run build:mac    # → Creates DMG
# OR
npm run build:win    # → Creates EXE (run on Windows or use cross-platform)
```

Output will be in the `dist/` folder.

---

## 📋 Prerequisites

### 1. Install Dependencies
```bash
cd ~/Documents/rfi-app
npm run install-all
```

### 2. Add App Icons (REQUIRED before building)

You need 3 icon files in the `assets/` folder:

| File | Used For | Size |
|------|----------|------|
| `assets/icon.png` | General | 512×512 px |
| `assets/icon.icns` | macOS DMG | Multi-size |
| `assets/icon.ico` | Windows EXE | Multi-size |

**Easiest way — create icons online:**
1. Go to **https://icon.kitchen** or **https://www.canva.com**
2. Create a 1024×1024 image with blue background + "RFI" text
3. Download as PNG → save as `assets/icon.png`

**Convert PNG → ICNS (macOS, run in Terminal):**
```bash
cd ~/Documents/rfi-app
mkdir -p assets/icon.iconset

# Create multiple sizes from your icon.png
sips -z 16 16     assets/icon.png --out assets/icon.iconset/icon_16x16.png
sips -z 32 32     assets/icon.png --out assets/icon.iconset/icon_16x16@2x.png
sips -z 32 32     assets/icon.png --out assets/icon.iconset/icon_32x32.png
sips -z 64 64     assets/icon.png --out assets/icon.iconset/icon_32x32@2x.png
sips -z 128 128   assets/icon.png --out assets/icon.iconset/icon_128x128.png
sips -z 256 256   assets/icon.png --out assets/icon.iconset/icon_128x128@2x.png
sips -z 256 256   assets/icon.png --out assets/icon.iconset/icon_256x256.png
sips -z 512 512   assets/icon.png --out assets/icon.iconset/icon_256x256@2x.png
sips -z 512 512   assets/icon.png --out assets/icon.iconset/icon_512x512.png
sips -z 1024 1024 assets/icon.png --out assets/icon.iconset/icon_512x512@2x.png

# Convert to ICNS
iconutil -c icns assets/icon.iconset -o assets/icon.icns

# Clean up
rm -rf assets/icon.iconset
echo "✅ icon.icns created!"
```

**Convert PNG → ICO (Windows icon):**
```bash
cd ~/Documents/rfi-app
npm install png-to-ico --save-dev
npx png-to-ico assets/icon.png > assets/icon.ico
echo "✅ icon.ico created!"
```

---

## 🍎 Build DMG for macOS

```bash
cd ~/Documents/rfi-app
npm run build:mac
```

This will:
1. Build the React app (`client/build/`)
2. Package everything with Electron
3. Create `dist/RFI Management-1.0.0.dmg`

**Install it:** Double-click the DMG → drag to Applications → done!

---

## 🪟 Build EXE for Windows

**Option A — Build on a Windows machine:**
```bash
cd rfi-app
npm run install-all
npm run build:win
```
Creates: `dist\RFI Management Setup 1.0.0.exe`

**Option B — Cross-compile on Mac (requires Wine/Docker):**
```bash
# Install Wine
brew install --cask wine-stable

# Then build
npm run build:win
```

---

## 📦 What gets packaged

The installer includes:
- ✅ React frontend (pre-built)
- ✅ Express.js backend server
- ✅ All server dependencies (node_modules)
- ✅ Electron runtime
- ✅ Splash screen

**NOT included (users must install separately):**
- ❌ MongoDB — users must install MongoDB Community Edition
- See `MONGODB_SETUP.txt` for instructions (include this with distribution)

---

## 🚀 Distribution Checklist

Before sharing with users:

- [ ] Build the app (`npm run build:mac` or `npm run build:win`)
- [ ] Test the installer on a clean machine
- [ ] Include `MONGODB_SETUP.txt` with your installer
- [ ] Tell users to install MongoDB FIRST before running the app

---

## 🔧 Troubleshooting Build Errors

**Error: `icon.icns not found`**
```bash
# Copy PNG as temporary placeholder
cp assets/icon.png assets/icon.icns
cp assets/icon.png assets/icon.ico
```

**Error: `NSIS not found` (Windows)**
```bash
npm install electron-builder --save-dev
```

**Error: `Code signing` issues on macOS**
The build command already has `--config.mac.identity=null` which skips code signing.
For App Store distribution, you'd need an Apple Developer account ($99/year).

**Error: `Cannot find module` in production**
```bash
cd server && npm install --production
```

---

## 📁 Output Files

After a successful build:

```
dist/
├── RFI Management-1.0.0.dmg          ← macOS installer
├── RFI Management-1.0.0-arm64.dmg    ← macOS Apple Silicon
├── RFI Management Setup 1.0.0.exe    ← Windows installer
└── latest.yml                        ← Auto-update manifest
```

Share the `.dmg` or `.exe` file with your users!

---

## 📞 Need Help?

If you get stuck, the most common fix is:
1. Delete `node_modules` and `client/build` folders
2. Run `npm run install-all` again
3. Run `npm run build:mac` or `npm run build:win`
