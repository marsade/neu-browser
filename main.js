const {app, BrowserWindow, Menu, ipcMain, shell, screen} = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';
let isLocked = false;
function createMainWindow () {
  mainWindow = new BrowserWindow({
    title: 'NEU Browser',
    minimizable: false,
    maximizable: true,
    moveable: true,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
      webviewTag: true,
      enableRemoteModule: true,
    }
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
}
  mainWindow.on('close', (event) => {
    if (isLocked) {
      event.preventDefault();
      mainWindow.setMovable(false);
    }
  })
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
    console.log('Window properties successfully updated');
  } catch (error) {
    console.error('Failed to update window properties:', error);
  }

  console.log(`Window is now ${isLocked ? 'locked' : 'unlocked'}`);
});
ipcMain.on('require-module', async (event, moduleName) => {
  try {
    const res = await require(moduleName);
    return res;
  } catch (error) {
    console.error(`Failed to require module: ${moduleName}`, error);
    return { error: error.message };
  }
})

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
