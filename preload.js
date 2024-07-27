const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('NEBrowserAPI', {
  quitApp: () => ipcRenderer.send('quit-app')
});
