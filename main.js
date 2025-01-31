const { app, BrowserWindow, Menu, ipcMain, globalShortcut, dialog, Notification} = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';
let isLocked = true;
let mainWindow;
let quitTimer;

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

  
  mainWindow.on('focus', () => {
    if (isLocked) {
      cancelQuit();
    }
  });

  mainWindow.on('blur', () => {
    if (isLocked) {
      warnAndQuit();
    }
  });

  mainWindow.on('minimize', () => {
    if (isLocked) {
      warnAndQuit();
    }
  });

  mainWindow.loadFile('renderer/index.html');
  mainWindow.maximize();
  mainWindow.on('closed', () => (mainWindow = null));
  registerShortcuts();
}

function registerShortcuts() {
  globalShortcut.register('Control+Shift+Q', () => {
    app.quit();
  });
  globalShortcut.register('Control+Shift+D+X', () => {
    if (isLocked) {
      isLocked = false;
      showNotification('Locks disabled', 'Browser locks disabled');
    }
  })
  globalShortcut.register('Control+Shift+I', () => {
    mainWindow.webContents.toggleDevTools();
  });
}

function showNotification(title, body) {
  new Notification({ title, body }).show();
}

function cancelQuit() {
  if (quitTimer) {
    clearTimeout(quitTimer);
    console.log('Quit process canceled as the app regained focus.');
  }
}

function warnAndQuit() {
  clearTimeout(quitTimer);
  
  dialog.showMessageBox(
    mainWindow, 
    {
      type: 'warning',
      title: 'NEU Browser',
      message: 'Browser is out of focus, Quitting in 5 seconds',
      buttons: ['Quit', 'Cancel']
    }
  ).then((result) => {
    if (result.response === 0) {
      app.quit();
    }
  });
  quitTimer = setTimeout(() => app.quit(), 5000);
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
