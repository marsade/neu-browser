const { app, BrowserWindow, Menu, ipcMain, globalShortcut} = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';
let isLocked = false;
let mainWindow;

function createMainWindow () {
  mainWindow = new BrowserWindow({
    title: 'NEU Browser',
    maximizable: true,
    minimizable: false,
    moveable: true,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  globalShortcut.register('Control+Shift+Q', () => {
    app.quit();
  });

  // mainWindow.on('blur', () => {
  //   console.log('App lost focus');
  //   if (isLocked) {
  //     console.log('App is locked and not in focus. Quitting...');
  //     app.quit();
  //   }
  // });

  mainWindow.on('close', (event) => {
    if (isLocked) {
      event.preventDefault();
      mainWindow.setMovable(false);
    }
  });
  mainWindow.loadFile('renderer/index.html');
  mainWindow.maximize();
  mainWindow.on('closed', () => (mainWindow = null));
}
ipcMain.on('quit-app', () => {
  app.quit();
});

app.whenReady().then(() => {
  createMainWindow();
  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  mainWindow = null; 
});
