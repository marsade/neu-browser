const { app, BrowserWindow, Menu, ipcMain, globalShortcut} = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';
const gotTheLock = app.requestSingleInstanceLock();
let isLocked = false;
let mainWindow;

function createMainWindow () {
  mainWindow = new BrowserWindow({
    title: 'NEU Browser',
    // resizable: false,
    maximizable: true,
    minimizable: false,
    moveable: true,
    frame: true,
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
ipcMain.on('toggle-lock', (event) => {
  console.log('Received toggle-lock event');
  console.log('Current isLocked state:', isLocked);

  isLocked = !isLocked;

  try {
    mainWindow.setResizable(!isLocked);
    mainWindow.setMovable(!isLocked);
    mainWindow.setMinimizable(!isLocked);
    mainWindow.setClosable(!isLocked);
    mainWindow.setFullScreenable(!isLocked);
    console.log('Window properties successfully updated');
  } catch (error) {
    console.error('Failed to update window properties:', error);
  }

  console.log(`Window is now ${isLocked ? 'locked' : 'unlocked'}`);
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
