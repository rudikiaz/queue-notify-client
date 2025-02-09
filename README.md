# Shuffle Queue Notifier

Shuffle Queue Notifier is an Electron-based desktop application designed to monitor your World of Warcraft retail folder's **Screenshots** subfolder for newly created `.tga` files. When a new file is detected, the application notifies a backend service via a `/notify` endpoint. The app also provides registration through a `/register` endpoint and includes a user-friendly Setup interface for managing settings and external integrations.

> **Note:**  
> The project is currently configured with `nodeIntegration: true` (enabled in `main.js`) for development purposes. In production you should switch it off and enable security measures accordingly.

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
  The application UI updates to display registration status and watcher activation status.

- **External Link Integration:**  
  Provides links for users to register on Telegram and install the QueueNotify WoW addon from CurseForge. External links are opened in the default system browser via Electron's API.

- **Configuration via `config.json`:**  
  The backend API endpoint is stored in `config.json`, making it easy to update without touching the source code.

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
  "apiBaseUrl": "http://localhost:8000"
}
```

You can update this URL to match your backend endpoint.

---

## Usage

### Running the Application

After installing dependencies, run the application with:

```bash
npm start
```

The application window will open with the following updated settings:
- **Window size:** 1000 x 800 pixels.
- **DevTools:** Disabled by default.
- **Node Integration:** Enabled (for development).

### Packaging the Application

You can package your Electron app using tools like [electron-packager](https://github.com/electron/electron-packager) or [electron-builder](https://www.electron.build/). For example, using electron-packager:

```bash
npm install -g electron-packager
electron-packager . ShuffleQueueNotifier --platform=win32 --arch=x64
```

This creates a standalone executable suitable for distribution.

---

## Application Structure

### Main Process (`main.js`)

- **Window Creation & Configuration:**  
  Creates and configures the main window with dimensions of 1000 x 800 pixels. The openDevTools call is commented out to avoid showing developer tools by default.
- **IPC & Folder Watcher Initialization:**  
  Instantiates the folder watcher and registers IPC handlers (in `lib/ipcHandlers.js`).

### Preload Script (`preload.js`)

- **Secure API Exposure:**  
  Uses Electron's `contextBridge` to expose functions (like folder selection, notification control, and opening external links) under `window.electronAPI`.
- **Configuration Exposure:**  
  Exposes settings from `config.json` to the renderer via `window.config`.

### Renderer Process (`renderer.js`)

- **UI Initialization & Event Binding:**  
  Handles generating and displaying the UUID, managing folder selection, registration, test notifications, and dynamically updating the watcher status.
- **External Link Handling:**  
  Binds click events for both the Telegram registration link and the CurseForge addon link (using `setupTelegramLink()` and the new `setupCurseForgeLink()` functions).

### HTML Layout (`index.html`)

- **Responsive Interface:**  
  The UI is built with Bootstrap and organized into a vertical navigation layout with two tabs: **QueueNotifier** (for status) and **Setup**.
- **Setup Tab Enhancements:**  
  The Setup tab now includes:
  - Instructions to share your UUID with the Telegram bot.
  - A new instruction prompting users to install the QueueNotify addon from CurseForge using a clickable link.

---

## Integration with WoW

For the application to function correctly, the QueueNotify addon must be installed in your World of Warcraft retail client. This addon communicates with the desktop application to properly synchronize notifications.

- **Installation Sources:**
  - [CurseForge](https://www.curseforge.com/wow/addons/queuenotify)  
  - [Wago](https://addons.wago.io/addons/queuenotify)

After installing the addon, ensure that it is enabled in your WoW client.

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
  Expects a payload containing an `"encodedID"`, which is then stored locally upon a successful registration.

### /notify Endpoint

- **Purpose:**  
  Notifies the backend during file events (or manual testing) with the registered encoded ID and notification retry count.
- **Request:**  
  ```json
  {
    "encodedID": "registered-encoded-id",
    "notifyRetries": 1
  }
  ```
- **Response:**  
  The result of the notification is displayed in the UI and logged in the application.

---

## External Links

The Setup interface provides two external links:
- **Telegram:**  
  Sends you to the Telegram bot (`@queuenotify_rudikiaz_bot`) for registration.
- **CurseForge:**  
  Opens the QueueNotify addon page from CurseForge using Electron's API. When clicked, these links are opened in the user's default system browser.

---

## Workflow

1. **Registration:**  
   - On first launch, a unique UUID is generated and displayed.
   - Share this UUID with the Telegram bot and click **Register UUID**. Upon successful registration, the encoded ID is stored.
2. **Folder Selection:**  
   - Use the **Select Folder** button to choose your WoW retail folder. The app then monitors the **Screenshots** subfolder.
3. **Watching & Notifications:**  
   - Once registered and a valid folder is selected, the folder watcher activates and updates the status.
   - New `.tga` files trigger the `/notify` endpoint and are deleted after being processed.
4. **Test Notifications:**  
   - Use the **Test Notifications** button to manually verify the notification flow.
5. **External Link Actions:**  
   - Click the Telegram link to register your Telegram user.
   - Click the CurseForge link to be redirected to the QueueNotify addon page in your default browser.

---

## Git Ignore

The `.gitignore` file ensures that files such as the `node_modules` folder are not committed to version control.

```
node_modules/
```

---

## License

This project is licensed under the MIT License.
