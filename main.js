const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let folderWatcher = null;
let watcherSettings = {}; // Store watcher settings: folder, uuid, notifyRetries

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 750,
        webPreferences: {
            // For security reasons, disable nodeIntegration and enable contextIsolation.
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove default menu bar (File, Edit, View, Window, Help)
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools(); // Open DevTools automatically
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// -----------------------------
// IPC Handlers and Folder Watcher
// -----------------------------

// Handle invoking folder selection
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Function that calls the /notify endpoint in the same manner as the Test Notifications button.
async function callNotifyWithRetries(eventType, filename) {
    // Check if notifications are enabled.
    if (watcherSettings.notifyEnabled === false) {
        console.log("Notifications are disabled, skipping notify call.");
        return;
    }

    const url = "http://localhost:8000/notify"; // Change to your API endpoint if needed.

    // Retrieve the registered ID from localStorage via the renderer.
    const registeredID = await mainWindow.webContents.executeJavaScript('localStorage.getItem("registeredID")');
    if (!registeredID) {
        console.error("No registered ID found, skipping notify call.");
        return;
    }

    // Get the current number of retries from the renderer.
    const currentRetries = await mainWindow.webContents.invoke('get-notify-retries');

    // Build the payload to mimic the Test Notifications button.
    const payload = {
        encodedID: registeredID,
        notifyRetries: currentRetries
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        // Send result back to the renderer for display.
        mainWindow.webContents.send('notify-result', { success: true, result });
    } catch (error) {
        mainWindow.webContents.send('notify-result', { success: false, error: error.message });
        console.error("Failed to notify:", error);
    }
}

// Start folder watcher when requested from renderer.
ipcMain.on('start-watcher', (event, settings) => {
    // Default to notifications enabled if not provided.
    if (typeof settings.notifyEnabled === 'undefined') {
         settings.notifyEnabled = (typeof watcherSettings.notifyEnabled !== 'undefined') ? watcherSettings.notifyEnabled : true;
    }
    watcherSettings = settings;

    if (folderWatcher) {
        folderWatcher.close();
        folderWatcher = null;
    }
    try {
        const screenshotsFolder = path.join(settings.folder, "Screenshots");
        if (!fs.existsSync(screenshotsFolder)) {
            console.error("Screenshots folder does not exist at:", screenshotsFolder);
            return;
        }

        // Start watching the Screenshots folder (non-recursive)
        folderWatcher = fs.watch(screenshotsFolder, { recursive: false }, (eventType, filename) => {
            if (!filename) return;
            // Only react to .tga files (case-insensitive)
            if (!filename.toLowerCase().endsWith('.tga')) return;

            const fullPath = path.join(screenshotsFolder, filename);
            // Check if the file exists to ensure it's a creation event
            fs.stat(fullPath, (err, stats) => {
                if (err) return;

                console.log(`New .tga file detected: ${fullPath}`);
                callNotifyWithRetries(eventType, fullPath);

                // Remove the .tga file after performing the notify call
                fs.unlink(fullPath, (err) => {
                    if (err) {
                        console.error("Failed to delete .tga file", fullPath, err);
                    } else {
                        console.log("Deleted .tga file", fullPath);
                    }
                });
            });
        });
        console.log("Folder watcher started on:", screenshotsFolder);
    } catch (error) {
        console.error("Error starting folder watcher:", error);
    }
});

// Stop the folder watcher as requested from renderer.
ipcMain.on('stop-watcher', () => {
    if (folderWatcher) {
        folderWatcher.close();
        folderWatcher = null;
        console.log("Folder watcher stopped.");
    }
});

// Add a handler for opening external links in the default browser.
ipcMain.handle('open-external', async (event, url) => {
    const { shell } = require('electron');
    return shell.openExternal(url);
});

// Handler to get the current notify retries value from the renderer.
ipcMain.handle('get-notify-retries', async () => {
    let value = await mainWindow.webContents.executeJavaScript('document.getElementById("notifyRetries").value');
    return parseInt(value, 10) || 1;
});

// Handler to update notification enabled flag.
ipcMain.on('update-notify-enabled', (event, enabled) => {
    watcherSettings.notifyEnabled = enabled;
    console.log("Notification enabled set to:", enabled);
}); 