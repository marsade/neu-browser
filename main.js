const {app, BrowserWindow, Menu, ipcMain, shell, screen} = require('electron');

const isDev = process.env.NODE_ENV !== 'production';

function createMainWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    title: 'NEU Browser',
    width: width,
    height: height,
    webPreferences: {
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

app.on('ready', () => {

  createMainWindow();
  Menu.setApplicationMenu(null);
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});