const { app, BrowserWindow, Menu, Tray } = require('electron');
const path = require('path');
const config = require('./config.json');

// Import modularized components.
const FolderWatcher = require('./lib/folderWatcher');
const { registerIpcHandlers } = require('./lib/ipcHandlers');

let mainWindow;
let folderWatcher;
let tray = null; // Global tray object

function createWindow() {
    // Check if the app was launched with the "--hidden" flag
    const startMinimized = process.argv.includes('--hidden');
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 850,
        show: !startMinimized, // if startMinimized is true, window is not shown
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

    // Create tray icon and set its context menu.
    const iconPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'trayIcon.png')
        : path.join(__dirname, 'trayIcon.png');
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => { mainWindow.show(); } },
        { label: 'Quit', click: () => { app.isQuiting = true; app.quit(); } }
    ]);
    tray.setToolTip('Queue Notifier');
    tray.setContextMenu(contextMenu);

    // Intercept the window's "close" event to hide it instead of quitting.
    mainWindow.on('close', (event) => {
        if (!app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
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