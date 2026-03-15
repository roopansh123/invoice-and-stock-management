const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  navigate: (callback) => ipcRenderer.on('navigate', callback),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  exportPDF: (invoiceId) => ipcRenderer.invoke('export-pdf', invoiceId),
  printInvoice: (html) => ipcRenderer.invoke('print-invoice', html),
  platform: process.platform,
});
