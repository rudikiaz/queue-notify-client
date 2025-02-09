const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    startWatcher: (settings) => ipcRenderer.send('start-watcher', settings),
    stopWatcher: () => ipcRenderer.send('stop-watcher'),
    onNotifyResult: (callback) =>
        ipcRenderer.on('notify-result', (event, data) => callback(data)),
    openExternalLink: (url) => ipcRenderer.invoke('open-external', url),
    updateNotifyEnabled: (enabled) => ipcRenderer.send('update-notify-enabled', enabled)
}); 