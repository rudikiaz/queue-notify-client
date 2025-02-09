const path = require('path');
const { contextBridge, ipcRenderer } = require('electron');
const config = require(path.join(__dirname, 'config.json'));

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    startWatcher: (settings) => ipcRenderer.send('start-watcher', settings),
    stopWatcher: () => ipcRenderer.send('stop-watcher'),
    onNotifyResult: (callback) =>
        ipcRenderer.on('notify-result', (event, data) => callback(data)),
    openExternalLink: (url) => ipcRenderer.invoke('open-external', url),
    updateNotifyEnabled: (enabled) => ipcRenderer.send('update-notify-enabled', enabled),
    getNotifyRetries: () => ipcRenderer.invoke('get-notify-retries')
});

// Expose the configuration to the renderer.
contextBridge.exposeInMainWorld('config', config); 