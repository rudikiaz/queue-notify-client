const { ipcMain, dialog, shell } = require('electron');

function registerIpcHandlers(mainWindow, folderWatcher) {
  // Folder selection handler.
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Start the folder watcher with provided settings.
  ipcMain.on('start-watcher', (event, settings) => {
    if (typeof settings.notifyEnabled === 'undefined') {
      settings.notifyEnabled = (typeof folderWatcher.settings.notifyEnabled !== 'undefined')
        ? folderWatcher.settings.notifyEnabled
        : true;
    }
    const started = folderWatcher.start(settings);
    if (!started) {
      console.error("Folder watcher failed to start.");
    }
  });

  // Stop the folder watcher.
  ipcMain.on('stop-watcher', () => {
    folderWatcher.stop();
  });

  // Open an external URL in the system default browser.
  ipcMain.handle('open-external', async (event, url) => {
    return shell.openExternal(url);
  });

  // Retrieve the current notifyRetries value.
  ipcMain.handle('get-notify-retries', async () => {
    let value = await mainWindow.webContents.executeJavaScript('document.getElementById("notifyRetries").value');
    return parseInt(value, 10) || 1;
  });

  // Update the notification enabled flag.
  ipcMain.on('update-notify-enabled', (event, enabled) => {
    folderWatcher.settings.notifyEnabled = enabled;
    console.log("Notification enabled set to:", enabled);
  });
}

module.exports = { registerIpcHandlers }; 