window.addEventListener('DOMContentLoaded', init);

function init() {
    const appUUID = initializeUUID();
    displayUUID(appUUID);
    setupNotifyRetries();
    const storedFolder = initializeFolder();
    updateWatcherStatusIndicator();
    setupNotificationToggle();
    setupRegistration(appUUID, storedFolder);
    setupFolderSelection(appUUID);
    setupTestNotification();
    setupTelegramLink();
    setupCurseForgeLink();
    bindNotifyResultListener();
}

function initializeUUID() {
    let uuid = localStorage.getItem('appUUID');
    if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem('appUUID', uuid);
    }
    return uuid;
}

function displayUUID(uuid) {
    const uuidDisplay = document.getElementById('uuidDisplay');
    if (uuidDisplay) {
        uuidDisplay.textContent = uuid;
    }
}

function setupNotifyRetries() {
    const notifyRetriesInput = document.getElementById('notifyRetries');
    let storedRetries = localStorage.getItem('notifyRetries');
    if (storedRetries) {
        notifyRetriesInput.value = storedRetries;
    } else {
        localStorage.setItem('notifyRetries', notifyRetriesInput.value);
    }
    notifyRetriesInput.addEventListener('change', (e) => {
        localStorage.setItem('notifyRetries', e.target.value);
    });
}

function initializeFolder() {
    let folder = localStorage.getItem('selectedFolder');
    if (!folder) {
        folder = "C:\\Program Files (x86)\\World of Warcraft\\_retail_";
        localStorage.setItem('selectedFolder', folder);
    }
    const folderPathEl = document.getElementById('folderPath');
    if (folderPathEl) {
        folderPathEl.textContent = folder;
    }
    return folder;
}

function updateWatcherStatusIndicator() {
    const watcherIndicator = document.getElementById('watcherStatusIndicator');
    const registeredID = localStorage.getItem('registeredID');
    const folder = localStorage.getItem('selectedFolder');
    if (!registeredID || !folder) {
        watcherIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
    } else {
        watcherIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
        const notifyRetriesInput = document.getElementById('notifyRetries');
        window.electronAPI.startWatcher({
            folder,
            uuid: localStorage.getItem('appUUID'),
            notifyRetries: parseInt(notifyRetriesInput.value, 10) || 1
        });
    }
}

function setupNotificationToggle() {
    const notifyToggle = document.getElementById('notifyToggle');
    const watcherIndicator = document.getElementById('watcherStatusIndicator');
    notifyToggle.addEventListener('change', () => {
        const enabled = notifyToggle.checked;
        window.electronAPI.updateNotifyEnabled(enabled);
        const registeredID = localStorage.getItem('registeredID');
        const storedFolder = localStorage.getItem('selectedFolder');
        if (!registeredID || !storedFolder) {
            watcherIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
        } else if (enabled) {
            watcherIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
        } else {
            watcherIndicator.innerHTML = '<span class="badge badge-secondary">Disabled</span>';
        }
    });
}

function setupRegistration(appUUID, storedFolder) {
    const registerButton = document.getElementById('registerButton');
    const registrationStatus = document.getElementById('registrationStatus');
    if (localStorage.getItem('registeredID')) {
        registrationStatus.textContent = `Registered`;
        registrationStatus.className = "text-success";
    } 
    registerButton.addEventListener('click', async () => {
        try {
            console.log('Registering UUID:', appUUID);

        const response = await fetch(window.config.apiBaseUrl + "/register", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: appUUID })
        });
        const result = await response.json();
        if (result && result.encodedID) {
            registrationStatus.textContent = `Registered`;
            registrationStatus.className = "text-success";
            localStorage.setItem('registeredID', result.encodedID);
            if (storedFolder) {
                document.getElementById('watcherStatusIndicator').innerHTML = '<span class="badge badge-success">Activated</span>';
            }
        } else {
            throw new Error("No registration string returned");
        }
    } catch (error) {
        console.error("Registration error:", error);
        registrationStatus.textContent = `Registration failed: ${error.message}`;
        registrationStatus.className = "text-danger";
    }
    });
}

function setupFolderSelection(appUUID) {
    const selectFolderButton = document.getElementById('selectFolderButton');
    const watcherIndicator = document.getElementById('watcherStatusIndicator');
    selectFolderButton.addEventListener('click', async () => {
        const folder = await window.electronAPI.selectFolder();
        if (folder) {
            localStorage.setItem('selectedFolder', folder);
            document.getElementById('folderPath').textContent = folder;
            if (localStorage.getItem('registeredID')) {
                const notifyRetriesInput = document.getElementById('notifyRetries');
                window.electronAPI.startWatcher({
                    folder,
                    uuid: localStorage.getItem('appUUID'),
                    notifyRetries: parseInt(notifyRetriesInput.value, 10) || 1
                });
                watcherIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
            } else {
                watcherIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
            }
        }
    });
}

function setupTestNotification() {
    const testButton = document.getElementById('testNotificationsButton');
    const notifyRetriesInput = document.getElementById('notifyRetries');
    testButton.addEventListener('click', async () => {
        const registeredID = localStorage.getItem('registeredID');
        if (!registeredID) {
            alert("No registered ID found. Please register your UUID first.");
            return;
        }
        const retries = parseInt(notifyRetriesInput.value, 10) || 1;
        const payload = { encodedID: registeredID, notifyRetries: retries };
        try {
            console.log("Sending test notification:", payload);
            const response = await fetch(window.config.apiBaseUrl + "/notify", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            const resultEl = document.getElementById('testNotifyResult');
            resultEl.style.display = 'block';
            resultEl.className = "alert alert-success";
            resultEl.textContent = "Test notification success: " + JSON.stringify(result);
        } catch (error) {
            console.error("Test notification error:", error);
            const resultEl = document.getElementById('testNotifyResult');
            resultEl.style.display = 'block';
            resultEl.className = "alert alert-danger";
            resultEl.textContent = "Test notification failed: " + error.message;
        }
    });
}

function setupTelegramLink() {
    const telegramLink = document.getElementById('telegramLink');
    telegramLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.electronAPI.openExternalLink('https://t.me/queuenotify_rudikiaz_bot');
    });
}

function setupCurseForgeLink() {
    const curseForgeLink = document.getElementById('curseForgeLink');
    if (curseForgeLink) {
        curseForgeLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.electronAPI && typeof window.electronAPI.openExternalLink === 'function') {
                window.electronAPI.openExternalLink('https://www.curseforge.com/wow/addons/queuenotify');
            } else {
                console.error("electronAPI is not available");
            }
        });
    }
}

function bindNotifyResultListener() {
    if (window.electronAPI.onNotifyResult) {
        window.electronAPI.onNotifyResult((data) => {
            console.log("Notify result:", data);
        });
    }
} 
