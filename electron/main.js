const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const isDev = process.env.NODE_ENV === 'development';
const PORT = 5001;
let mainWindow = null;
let serverProcess = null;
let appReady = false;

function startServer() {
  const serverPath = path.join(process.resourcesPath, 'server', 'index.js');

  // Client build is inside the asar package
  const clientBuildPath = isDev
    ? path.join(__dirname, '../client/build')
    : path.join(process.resourcesPath, 'app.asar', 'client', 'build');

  const fs = require('fs');
  // Fallback: try non-asar path too
  const clientBuildFinal = fs.existsSync(clientBuildPath)
    ? clientBuildPath
    : path.join(process.resourcesPath, 'app', 'client', 'build');

  const env = {
    ...process.env,
    NODE_ENV: 'production',
    PORT: String(PORT),
    MONGO_URI: 'mongodb+srv://roopanshsethi29_db_user:aldpenbumVPdLA9r@rfimanagement.ygvntc7.mongodb.net/',
    JWT_SECRET: 'rfi-super-secret-jwt-2024',
    CLIENT_BUILD_PATH: clientBuildFinal,
  };

  // Find node — works on Mac (homebrew arm64/x64) and Windows
  let nodePath = 'node';
  if (process.platform === 'darwin') {
    const fs2 = require('fs');
    for (const c of ['/opt/homebrew/bin/node', '/usr/local/bin/node', '/usr/bin/node']) {
      if (fs2.existsSync(c)) { nodePath = c; break; }
    }
  }

  serverProcess = spawn(nodePath, [serverPath], { env, stdio: 'pipe' });
  serverProcess.stdout.on('data', d => console.log('[SERVER]', d.toString()));
  serverProcess.stderr.on('data', d => console.error('[SERVER ERR]', d.toString()));
  serverProcess.on('error', err => console.error('[SPAWN ERROR]', err));
}

function waitForServer() {
  return new Promise((resolve) => {
    let tries = 0;
    const check = () => {
      http.get(`http://localhost:${PORT}/health`, () => resolve())
        .on('error', () => {
          if (++tries < 30) setTimeout(check, 500);
          else resolve();
        });
    };
    setTimeout(check, 1500);
  });
}

function createWindow() {
  if (!appReady) return;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    title: 'RFI — Ram Footware Industries',
    backgroundColor: '#1a1714',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `http://localhost:${PORT}`;

  mainWindow.loadURL(url);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    // mainWindow.webContents.openDevTools(); // uncomment to debug
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  const template = [
    { label: 'File', submenu: [
      { label: 'New Invoice', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('navigate', '/billing/new') },
      { type: 'separator' },
      { role: 'quit' }
    ]},
    { label: 'View', submenu: [
      { role: 'reload' },
      { role: 'togglefullscreen' },
    ]},
    { label: 'Help', submenu: [
      { label: 'About RFI', click: () => dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'RFI Management',
        message: 'Ram Footware Industries\nBilling & Inventory v1.0.0'
      })},
      { label: 'Open Data Folder', click: () => shell.openPath(app.getPath('userData')) },
    ]},
  ];

  if (process.platform === 'darwin') {
    template.unshift({ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  appReady = true;
  startServer();
  await waitForServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (appReady && mainWindow === null) createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
});

ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.handle('print-invoice', () => {
  mainWindow?.webContents.print({ silent: false, printBackground: true }, () => {});
});
ipcMain.handle('export-pdf', async (e, num) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `Invoice_${num}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  return filePath || null;
});
