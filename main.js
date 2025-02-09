const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const config = require('./config.json');

// Import modularized components.
const FolderWatcher = require('./lib/folderWatcher');
const { registerIpcHandlers } = require('./lib/ipcHandlers');

let mainWindow;
let folderWatcher;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            // For security reasons, disable nodeIntegration and enable contextIsolation.
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove the default OS menu.
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('index.html');
    //mainWindow.webContents.openDevTools();

    // Instantiate the folder watcher with the main window and configuration.
    folderWatcher = new FolderWatcher(mainWindow, config);

    // Register all IPC handlers.
    registerIpcHandlers(mainWindow, folderWatcher);
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
}); 