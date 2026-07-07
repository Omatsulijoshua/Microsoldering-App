const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the React renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  scanUsbDevices: () => ipcRenderer.invoke('scan-usb-devices')
});
