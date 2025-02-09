# Shuffle Queue Notifier

Shuffle Queue Notifier is an Electron-based desktop application designed to help monitor your World of Warcraft retail folder's **Screenshots** subdirectory for newly created `.tga` files. When a new file is detected, the application sends a notification request to a backend endpoint. It also provides registration via a `/register` endpoint along with the ability to send test notifications and manage settings through a user-friendly interface built with Bootstrap.

---

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
  - [HTML Layout (`index.html`)](#index-html)
- [Endpoints](#endpoints)
  - [/register Endpoint](#register-endpoint)
  - [/notify Endpoint](#notify-endpoint)
- [WoW Integration](#wow-integration)
- [Workflow](#workflow)
- [Git Ignore](#git-ignore)
- [License](#license)

---

## Features

- **UUID Registration:**  
  Automatically generates a unique UUID for your device. You can register this ID using the `/register` endpoint so that your computer is uniquely identified.
  
- **Folder Monitoring:**  
  Monitors the **Screenshots** subfolder within your selected World of Warcraft retail folder for newly created `.tga` files. When a file is detected, it calls the `/notify` endpoint and deletes the file afterward.

- **Test Notifications:**  
  Provides a button to manually send a test notification to the `/notify` endpoint.

- **Persistent Settings:**  
  Settings such as the selected folder, notification retry count, and registered encoded ID are stored in the browser's local storage.

- **Configurable API Endpoint:**  
  The backend API base URL is externalized to a `config.json` file, allowing you to adjust it without modifying the application code.

- **Clean, Responsive UI:**  
  Uses Bootstrap to create a vertical navigation interface with two tabs: **QueueNotifier** (for status and notifications toggle) and **Setup** (for registration and configuration).

---

## Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

---

## Configuration

The API base URL is configured in the `config.json` file:

```json
{
  "apiBaseUrl": "http://localhost:8000"
}
```

You can change the `"apiBaseUrl"` value to point to the appropriate backend server.

---

## Usage

### Running the Application

After installing the dependencies, launch the application with:

```bash
npm start
```

The Electron app will start and open a window that automatically opens Developer Tools for debugging.

### Packaging the Application

To package your Electron app (for example, for Windows), you can use tools like [electron-packager](https://github.com/electron/electron-packager) or [electron-builder](https://www.electron.build/). For instance, using electron-packager:

```bash
npm install -g electron-packager
electron-packager . ShuffleQueueNotifier --platform=win32 --arch=x64
```

This command creates a standalone executable for Windows.

---

## Application Structure

### Main Process (`main.js`)

- **Window Creation:**  
  Creates the main application window, sets size, loads `index.html`, and removes the default OS menu.

- **Folder Watcher & IPC Handlers:**  
  - Handles folder selection dialogs.
  - Starts a watcher on the **Screenshots** folder (subdirectory of the selected WoW retail folder).
  - Listens for `.tga` file creation events, calls the `/notify` endpoint, and deletes the file after processing.
  - Uses settings (such as `notifyRetries` and `notifyEnabled`) and the API base URL from the `config.json`.

### Preload Script (`preload.js`)

- **Context Isolation:**  
  Uses `contextBridge` to expose secure APIs to the renderer.
  
- **API Exposure:**  
  Provides functions for:
  - Selecting a folder.
  - Starting and stopping the watcher.
  - Opening external links.
  - Updating notification settings.
  
- **Configuration Exposure:**  
  The configuration from `config.json` (such as the API base URL) is exposed to the renderer.

### Renderer Process (`renderer.js`)

- **UI Logic & Settings Persistence:**  
  Manages:
  - Unique UUID generation and display.
  - Registration process for connecting with the `/register` endpoint.
  - Folder selection with a default fallback (`C:\Program Files (x86)\World of Warcraft\_retail_`).
  - Notification retry count persistence.
  - Updating the status indicator based on registration and folder selection.
  - Sending test notifications to the `/notify` endpoint.
  
- **Interaction with Main Process:**  
  Uses the exposed `electronAPI` to communicate with the main process and update settings dynamically.

### HTML Layout (`index.html`)

- **Vertical Navigation Interface:**  
  Uses Bootstrap to layout two tabs:
  - **QueueNotifier:** Displays watcher status and a toggle for enabling/disabling notifications.
  - **Setup:** Contains registration, folder selection, notification retry settings, and a test notification button.

- **Responsive UI Elements:**  
  Contains relevant buttons and input fields organized using Bootstrap components.

---

## Endpoints

### /register Endpoint

- **Purpose:**  
  Registers the device's UUID with your backend.

- **Request:**  
  Send a POST request with a JSON payload:

  ```json
  { "id": "device-uuid" }
  ```

- **Response:**  
  Expects a JSON object containing an `"encodedID"` key. This encoded ID is stored locally once registration is successful.

### /notify Endpoint

- **Purpose:**  
  Notifies the backend of a new screenshot (or via a manual test).

- **Request:**  
  Send a POST request with a JSON payload:

  ```json
  {
    "encodedID": "registered-encoded-id",
    "notifyRetries": 1
  }
  ```

- **Response:**  
  The response from this endpoint is used to update the application UI and log the result.

## WoW Integration

For the application to work properly, the corresponding World of Warcraft addon must be installed. The **QueueNotify** addon facilitates communication between your WoW client and this desktop application, ensuring that notifications are correctly routed.

You can install the addon from the following sources:

- [CurseForge](https://www.curseforge.com/wow/addons/queuenotify)
- [Wago](https://addons.wago.io/addons/queuenotify)

After installation, please ensure that the addon is enabled in your World of Warcraft retail client.

## Workflow

1. **Registration:**  
   - Upon launch, the application displays a unique UUID.
   - Click **Register UUID** to send the UUID to the backend via the `/register` endpoint. The returned encoded ID is stored in local storage.

2. **Folder Selection:**  
   - Use **Select Folder** to choose the World of Warcraft retail folder. If not selected, the default path `"C:\Program Files (x86)\World of Warcraft\_retail_"` is used.
   - The application automatically monitors the **Screenshots** subfolder for new `.tga` files.

3. **Watcher Activation:**  
   - When both a valid registered encoded ID and a folder are present, the watcher is activated, and the status indicator updates accordingly.
   - When a `.tga` file is detected, the `/notify` endpoint is called and the file is subsequently deleted.

4. **Test Notifications:**  
   - Use the **Test Notifications** button in the Setup tab to manually trigger a notification using the current settings.

5. **Notification Toggle:**  
   - Use the toggle in the QueueNotifier tab to enable or disable notifications dynamically.

---

## Git Ignore

The `.gitignore` file ensures that commonly ignored files and directories (like the `node_modules` folder) are not committed to version control.

---

## License

This project is licensed under the MIT License.
