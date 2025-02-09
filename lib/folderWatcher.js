const fs = require('fs');
const path = require('path');

class FolderWatcher {
  /**
   * @param {BrowserWindow} mainWindow - Reference to the main BrowserWindow.
   * @param {Object} config - The application configuration.
   */
  constructor(mainWindow, config) {
    this.mainWindow = mainWindow;
    this.config = config;
    this.watcher = null;
    // Expected settings: { folder, uuid, notifyRetries, notifyEnabled }
    this.settings = {};
    // Map to track recently processed files to debounce duplicate events
    this.recentFiles = new Map();
  }

  /**
   * Start watching the Screenshots folder.
   * @param {Object} settings 
   * @returns {boolean} - Returns true if watcher is started, false otherwise.
   */
  start(settings) {
    this.settings = settings;
    if (this.watcher) {
      this.stop();
    }
    const screenshotsFolder = path.join(settings.folder, "Screenshots");
    if (!fs.existsSync(screenshotsFolder)) {
      console.error("Screenshots folder does not exist at:", screenshotsFolder);
      return false;
    }
    this.watcher = fs.watch(screenshotsFolder, { recursive: false }, (eventType, filename) => {
      if (!filename) return;
      // Only process .tga files (case-insensitive).
      if (!filename.toLowerCase().endsWith('.tga')) return;
      const fullPath = path.join(screenshotsFolder, filename);
      // Debounce: Check if this file was processed recently (within 1 second)
      const now = Date.now();
      if (this.recentFiles.has(fullPath) && now - this.recentFiles.get(fullPath) < 1000) {
         return;
      }
      this.recentFiles.set(fullPath, now);
      // Clear entry after 2 seconds to allow reprocessing if necessary
      setTimeout(() => this.recentFiles.delete(fullPath), 2000);
      // Verify the file exists.
      fs.stat(fullPath, (err, stats) => {
        if (err) return;
        console.log(`Detected new .tga file: ${fullPath}`);
        this.notifyFile(fullPath);
      });
    });
    console.log("Folder watcher started on:", screenshotsFolder);
    return true;
  }

  /**
   * Calls the /notify endpoint and deletes the file.
   * @param {string} fullPath - Full path of the .tga file.
   */
  async notifyFile(fullPath) {
    if (this.settings.notifyEnabled === false) {
      console.log("Notifications are disabled. Skipping file:", fullPath);
      return;
    }
    // Retrieve registeredID from renderer localStorage.
    const registeredID = await this.mainWindow.webContents.executeJavaScript('localStorage.getItem("registeredID")');
    if (!registeredID) {
      console.error("No registered ID found. Cannot notify for file:", fullPath);
      return;
    }
    // Use notifyRetries from settings.
    const currentRetries = this.settings.notifyRetries;
    const url = this.config.apiBaseUrl + "/notify";
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
      this.mainWindow.webContents.send('notify-result', { success: true, result });
      console.log("Notification sent successfully for file:", fullPath);
    } catch (error) {
      this.mainWindow.webContents.send('notify-result', { success: false, error: error.message });
      console.error("Failed to notify for file:", fullPath, error);
    }
    // Delete the file after notification.
    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error("Failed to delete file:", fullPath, err);
      } else {
        console.log("Deleted file:", fullPath);
      }
    });
  }

  /**
   * Stops the folder watcher.
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log("Folder watcher stopped.");
    }
  }
}

module.exports = FolderWatcher; 