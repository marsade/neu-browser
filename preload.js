const { contextBridge, ipcRenderer } = require('electron');
const debounce = require('./renderer/js/utils')
const { Draggable } = require('@shopify/draggable');


contextBridge.exposeInMainWorld('electronAPI', {
  quitApp: () => ipcRenderer.send('quit-app'),
  toggleLock: (state) => ipcRenderer.send('toggle-lock', state),
  debounce,
});

contextBridge.exposeInMainWorld('draggable', {
  create: (selectors, options) => {
    return new Draggable(document.querySelectorAll(selectors), options);
  }
});
