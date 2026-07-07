const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0b0f19',
    title: 'Microsolder AI - Diagnostic Suite',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load local Vite dev server in development or index.html in production
  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'dist', 'index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handler: USB Device Discovery
ipcMain.handle('scan-usb-devices', async () => {
  const result = {
    connected: false,
    brand: 'No USB Device Detected',
    model: 'N/A',
    serialNumber: 'N/A',
    osVersion: 'N/A',
    bootMode: 'Unknown',
    rawDetails: 'USB scanning active.',
  };

  try {
    // 1. Scan iOS
    const { stdout: iosOut } = await execPromise('ideviceinfo -s');
    const lines = iosOut.split('\n');
    const infoMap = {};
    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx !== -1) {
        infoMap[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
      }
    }
    if (infoMap['SerialNumber']) {
      return {
        connected: true,
        brand: 'Apple',
        model: infoMap['ProductType'] || 'iPhone',
        serialNumber: infoMap['SerialNumber'],
        osVersion: infoMap['ProductVersion'] || 'iOS',
        bootMode: 'Normal',
        rawDetails: iosOut,
      };
    }
  } catch (e) {}

  try {
    // 2. Scan Android
    const { stdout: adbOut } = await execPromise('adb devices');
    const lines = adbOut.trim().split('\n');
    if (lines.length > 1 && lines[1].trim() !== '') {
      const [serial, state] = lines[1].split(/\s+/);
      if (state === 'device') {
        const { stdout: brand } = await execPromise(`adb -s ${serial} shell getprop ro.product.brand`);
        const { stdout: model } = await execPromise(`adb -s ${serial} shell getprop ro.product.model`);
        return {
          connected: true,
          brand: brand.trim(),
          model: model.trim(),
          serialNumber: serial,
          osVersion: 'Android',
          bootMode: 'Normal',
          rawDetails: `ADB Connection: Online\nSerial: ${serial}`,
        };
      }
    }
  } catch (e) {}

  return result;
});
