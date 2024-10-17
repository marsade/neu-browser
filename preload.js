const { contextBridge, ipcRenderer } = require('electron');
const { Draggable } = require('@shopify/draggable');


contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('quit-app'),
  toggleLock: (state) => ipcRenderer.send('toggle-lock', state)
});

contextBridge.exposeInMainWorld('draggable', {
  create: (selectors, options) => {
    return new Draggable(document.querySelectorAll(selectors), options);
  }
});