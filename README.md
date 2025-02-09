# Shuffle Queue Notifier

Shuffle Queue Notifier is an Electron-based desktop application designed to monitor your World of Warcraft retail folder's **Screenshots** subfolder for newly created `.tga` files. When a new file is detected, the application notifies a backend service via a `/notify` endpoint. The app also provides registration through a `/register` endpoint and includes a user-friendly Setup interface for managing settings and external integrations.

> **Note:**  
> For development purposes, the project is currently configured with `nodeIntegration: true` in `main.js`. In production, you should disable node integration and enable additional security measures.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Running the Application](#running-the-application)
  - [Packaging the Application](#packaging-the-application)
- [Application Structure](#application-structure)
  - [Main Process (`main.js`)](#main-js)
  - [Preload Script (`preload.js`)](#preload-js)
  - [Renderer Process (`renderer.js`)](#renderer-js)
  - [HTML Layout (`index.html`)](#indexhtml)
- [Integration with WoW](#integration-with-wow)
- [Endpoints](#endpoints)
  - [/register Endpoint](#register-endpoint)
  - [/notify Endpoint](#notify-endpoint)
- [External Links](#external-links)
- [Tray Functionality](#tray-functionality)
- [Auto-Start Settings](#auto-start-settings)
- [Workflow](#workflow)
- [Git Ignore](#git-ignore)
- [License](#license)

---

## Features

- **Automatic UUID Generation & Registration:**  
  Generates a unique UUID for your computer and allows registration via the `/register` endpoint. Once registered, the encoded ID is stored in local storage.

- **Folder Monitoring:**  
  Uses a dedicated folder watcher (in `lib/folderWatcher.js`) to monitor the **Screenshots** subfolder for new `.tga` files. When a file is detected, it triggers the `/notify` endpoint before deleting the file.

- **Test Notifications:**  
  Allows you to manually trigger a test notification by sending a payload to the `/notify` endpoint.

- **Real-time UI Updates:**  
  The UI updates to display registration status, the current folder watcher status, and other settings.

- **External Link Integration:**  
  Provides clickable links that open in the default system browser. These include the Telegram bot link for user registration and the CurseForge addon link for installing the QueueNotify WoW addon.

- **Tray Support:**  
  The application now supports minimizing to the system tray. When the close (X) button is pressed, the app hides in the tray. The tray icon menu lets you restore the window or quit the application.

- **Auto-Start Toggle:**  
  A new toggle in the main (QueueNotifier) tab lets users enable or disable starting the process on system boot. When enabled, the application will automatically launch on system start using Electron's native `setLoginItemSettings`.

- **Configuration via `config.json`:**  
  The backend API endpoint is stored in `config.json`—currently set to `http://wow.flesn.uk`—so it can be easily updated without modifying source code.

---

## Installation

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd queue-notify-client
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

---

## Configuration

The API base URL is defined in the `config.json` file. For example:

```json
{
  "apiBaseUrl": "http://wow.flesn.uk"
}
```

You may update this URL to match your backend endpoint.

---

## Usage

### Running the Application

After installing dependencies, run the application with:

```bash
npm start
```

The application window will open with the following settings:

- **Window Size:** 1100 x 850 pixels.
- **DevTools:** Disabled by default.
- **Node Integration:** Enabled for development.

### Packaging the Application

You can package your Electron app using tools like [electron-packager](https://github.com/electron/electron-packager) or [electron-builder](https://www.electron.build/). For example, using electron-packager:

```bash
npm install -g electron-packager
electron-packager . ShuffleQueueNotifier --platform=win32 --arch=x64
```

This creates a standalone executable for distribution.

---

## Application Structure

### Main Process (`main.js`)

- **Window Creation & Configuration:**  
  Creates the main window with dimensions 1100 x 850 and loads `index.html`.
  
- **Tray Functionality:**  
  A tray icon (`trayIcon.png`) is created with a context menu that provides options to show the app or quit. The application is hidden to the tray when the close (X) button is pressed.
  
- **Folder Watcher & IPC Initialization:**  
  The main process instantiates the folder watcher (from `lib/folderWatcher.js`) and registers IPC handlers (in `lib/ipcHandlers.js`).

### Preload Script (`preload.js`)

- **Secure API Exposure:**  
  Uses Electron's `contextBridge` to expose safe APIs to the renderer process. These APIs include functions for selecting folders, starting and stopping the watcher, and updating settings (like notifications and auto-start).
  
- **Configuration Exposure:**  
  The configuration from `config.json` is exposed to the renderer via `window.config`.

### Renderer Process (`renderer.js`)

- **UI Initialization & Event Binding:**  
  Manages UUID generation, folder selection, registration, test notifications, and dynamic status updates. It also binds click events for external links and the auto-start toggle.
  
- **Auto-Start Toggle:**  
  A new function (`setupAutoStartToggle()`) binds the auto-start switch on the main tab to update the application's auto-start behavior through IPC.

### HTML Layout (`index.html`)

- **Responsive Interface:**  
  Built with Bootstrap, the UI is organized into a vertical navigation layout with two tabs: **QueueNotifier** (for status and settings) and **Setup** (for registration and folder selection).

- **Setup Tab Enhancements:**  
  The Setup tab includes:
  - Instructions for sharing the UUID with the Telegram bot.
  - A link to install the QueueNotify addon from CurseForge.
  - The auto-start toggle and other configuration components.

---

## Integration with WoW

For proper functionality, the QueueNotify addon must be installed in your World of Warcraft retail client. The addon synchronizes notifications between your WoW client and this application.

- **Installation Sources:**
  - [CurseForge](https://www.curseforge.com/wow/addons/queuenotify)
  - [Wago](https://addons.wago.io/addons/queuenotify)

After installation, ensure the addon is enabled in your WoW client.

---

## Endpoints

### /register Endpoint

- **Purpose:**  
  Registers your computer by sending the generated UUID.
- **Request:**  
  ```json
  { "id": "your-uuid" }
  ```
- **Response:**  
  A payload containing an `"encodedID"` is expected. This value is then stored locally upon successful registration.

### /notify Endpoint

- **Purpose:**  
  Notifies the backend when file events occur (or during a manual test) using the registered encoded ID and notification retry count.
- **Request:**  
  ```json
  {
    "encodedID": "registered-encoded-id",
    "notifyRetries": 1
  }
  ```
- **Response:**  
  The result of the notification is displayed in the UI and logged by the application.

---

## External Links

The Setup interface provides clickable external links that are opened in the default system browser:

- **Telegram:**  
  Redirects to the Telegram bot (`@queuenotify_rudikiaz_bot`) for registering your Telegram user.

- **CurseForge:**  
  Opens the QueueNotify addon page on CurseForge so that you can install the addon required for proper synchronization.

---

## Tray Functionality

The application now minimizes to the system tray when the close button is pressed. In the tray icon's context menu, you have two options:

- **Show App:** Restores the hidden window.
- **Quit:** Exits the application (sets a flag and then calls `app.quit()`).

---

## Auto-Start Settings

A new auto-start toggle is provided on the main (QueueNotifier) tab. When enabled, this setting configures the application to start automatically on system boot via Electron's `setLoginItemSettings`.

---

## Workflow

1. **Registration:**  
   - On first launch, a unique UUID is generated and displayed.
   - Share this UUID with the Telegram bot and click **Register UUID**. Upon successful registration, the encoded ID is stored.
2. **Folder Selection:**  
   - Use the **Select Folder** button to choose your WoW retail folder. The app monitors the **Screenshots** subfolder.
3. **Watching & Notifications:**  
   - When registered and a valid folder is selected, the folder watcher is activated.
   - New `.tga` files trigger the `/notify` endpoint and are deleted after processing.
4. **Test Notifications:**  
   - Use the **Test Notifications** button to manually verify the notification flow.
5. **External Link Actions:**  
   - Click the Telegram link to register your Telegram user.
   - Click the CurseForge link to be redirected to the QueueNotify addon page in your default browser.
6. **Tray & Auto-Start:**  
   - When you close the window, the app hides to the system tray.  
   - Use the auto-start toggle to configure whether the app should launch automatically with your system.

---

## Git Ignore

The `.gitignore` file ensures that files and directories such as `node_modules` are not committed to version control.

```
node_modules/
```

---

## License

This project is licensed under the MIT License.
