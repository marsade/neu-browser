const {app, BrowserWindow, Menu, ipcMain, shell, screen} = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

function createMainWindow () {
  mainWindow = new BrowserWindow({
    title: 'NEU Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
}

  mainWindow.loadFile('renderer/index.html');

  mainWindow.maximize();
  mainWindow.on('closed', () => (mainWindow = null));
}

app.whenReady().then(() => {
  createMainWindow()
  Menu.setApplicationMenu(null);

  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})




app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('quit-app', () => {
  app.quit();
});