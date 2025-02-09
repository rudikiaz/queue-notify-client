window.addEventListener('DOMContentLoaded', () => {
    
    // Retrieve or generate a persistent UUID
    let appUUID = localStorage.getItem('appUUID');
    if (!appUUID) {
        appUUID = window.crypto.randomUUID(); // Requires a modern Electron version
        localStorage.setItem('appUUID', appUUID);
    }
    // Display the UUID in the Setup tab
    const uuidDisplay = document.getElementById('uuidDisplay');
    if (uuidDisplay) {
        uuidDisplay.textContent = appUUID;
    }
    
    // Update registration status label from stored value, if available
    const registrationStatus = document.getElementById('registrationStatus');
    if (registrationStatus) {
        const storedRegistration = localStorage.getItem('registeredID');
        if (storedRegistration) {
            registrationStatus.textContent = `Registered`;
            registrationStatus.classList.remove('text-muted', 'text-danger');
            registrationStatus.classList.add('text-success');
        } else {
            registrationStatus.textContent = "Not registered";
            registrationStatus.classList.remove('text-success', 'text-danger');
            registrationStatus.classList.add('text-muted');
        }
    }
    
    // Persist and load notifyRetries value.
    const notifyRetriesInput = document.getElementById('notifyRetries');
    let storedRetries = localStorage.getItem('notifyRetries');
    if (storedRetries) {
         notifyRetriesInput.value = storedRetries;
    } else {
         localStorage.setItem('notifyRetries', notifyRetriesInput.value);
    }
    notifyRetriesInput.addEventListener('change', () => {
         localStorage.setItem('notifyRetries', notifyRetriesInput.value);
    });
    
    // Load the stored folder or use default if not present.
    let storedFolder = localStorage.getItem('selectedFolder');
    if (!storedFolder) {
         storedFolder = "C:\\Program Files (x86)\\World of Warcraft\\_retail_";
         localStorage.setItem("selectedFolder", storedFolder);
    }

    // Obtain the global watcher status indicator element.
    const watcherStatusIndicator = document.getElementById('watcherStatusIndicator');
    // If either registeredID or storedFolder is missing, update the indicator accordingly.
    if (!localStorage.getItem('registeredID') || !storedFolder) {
         if (watcherStatusIndicator) {
             watcherStatusIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
         }
    } else {
         // If both are available, update folder path and start watcher.
         const folderPathEl = document.getElementById('folderPath');
         if (folderPathEl) {
             folderPathEl.textContent = storedFolder;
         }
         const notifyRetries = parseInt(notifyRetriesInput.value, 10) || 1;
         window.electronAPI.startWatcher({ folder: storedFolder, uuid: appUUID, notifyRetries });
         if (watcherStatusIndicator) {
             watcherStatusIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
         }
    }

    // Notification toggle in QueueNotifier tab
    const notifyToggle = document.getElementById('notifyToggle');
    if (notifyToggle) {
        notifyToggle.addEventListener('change', () => {
            const enabled = notifyToggle.checked;
            window.electronAPI.updateNotifyEnabled(enabled);
            const watcherStatusIndicator = document.getElementById('watcherStatusIndicator');
            if (watcherStatusIndicator) {
                if (!localStorage.getItem('registeredID') || !storedFolder) {
                    watcherStatusIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
               } else if (enabled) {
                    watcherStatusIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
                } else {
                    watcherStatusIndicator.innerHTML = '<span class="badge badge-secondary">Disabled</span>';
                }
            }
        });
    }
    
    // Register button: calls /register with the UUID.
    const registerButton = document.getElementById('registerButton');
    if (registerButton) {
        registerButton.addEventListener('click', async () => {
            try {
                console.log('Initiating registration request with UUID:', appUUID);
                const response = await fetch(window.config.apiBaseUrl + "/register", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: appUUID })
                });
                console.log('Registration response status:', response.status);
                const result = await response.json();
                console.log('Registration response data:', result);
                
                // Assume the endpoint returns a JSON object with a key "encodedID"
                if (result && result.encodedID) {
                    if (registrationStatus) {
                        registrationStatus.textContent = `Registered`;
                        registrationStatus.classList.remove('text-muted', 'text-danger');
                        registrationStatus.classList.add('text-success');
                    }
                    localStorage.setItem('registeredID', result.encodedID);
                    console.log('Registration successful, stored ID:', result.encodedID);
                    // If a folder is already selected, update the watcher indicator to activated.
                    if (storedFolder && watcherStatusIndicator) {
                        watcherStatusIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
                    }
                } else {
                    throw new Error("No registration string returned");
                }
            } catch (error) {
                console.error("Error registering:", error);
                console.error("Error details:", {
                    message: error.message,
                    stack: error.stack
                });
                if (registrationStatus) {
                    registrationStatus.textContent = `Registration failed: ${error.message}`;
                    registrationStatus.classList.remove('text-muted', 'text-success');
                    registrationStatus.classList.add('text-danger');
                }
            }
        });
    }
    
    // Folder selection logic in the Setup tab
    const selectFolderButton = document.getElementById('selectFolderButton');
    if (selectFolderButton) {
        selectFolderButton.addEventListener('click', async () => {
            const folder = await window.electronAPI.selectFolder();
            if (folder) {
                document.getElementById('folderPath').textContent = folder;
                // Persist the selected folder in localStorage.
                localStorage.setItem('selectedFolder', folder);
                storedFolder = folder; // update the variable
                // After updating the folder, if a registeredID exists, start the watcher.
                if (localStorage.getItem('registeredID')) {
                    const retries = parseInt(notifyRetriesInput.value, 10) || 1;
                    window.electronAPI.startWatcher({ folder, uuid: appUUID, notifyRetries: retries });
                    if (watcherStatusIndicator) {
                        watcherStatusIndicator.innerHTML = '<span class="badge badge-success">Activated</span>';
                    }
                } else {
                    if (watcherStatusIndicator) {
                        watcherStatusIndicator.innerHTML = '<span class="badge badge-warning">Please read Setup, not registered yet</span>';
                    }
                }
            }
        });
    }
    
    // Test Notifications button event listener
    const testNotifyButton = document.getElementById('testNotificationsButton');
    if (testNotifyButton) {
        testNotifyButton.addEventListener('click', async () => {
            // Get the stored registered ID
            const registeredID = localStorage.getItem('registeredID');
            if (!registeredID) {
                alert("No registered ID found. Please register your UUID first.");
                return;
            }
            // Get the current retries value
            const retries = parseInt(notifyRetriesInput.value, 10) || 1;

            // Build the payload for the test notify POST.
            const payload = { encodedID: registeredID, notifyRetries: retries };
            try {
                console.log("Sending test notification with payload:", payload);
                const response = await fetch(window.config.apiBaseUrl + "/notify", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                console.log("Test notification response:", result);
                const testNotifyResult = document.getElementById('testNotifyResult');
                testNotifyResult.style.display = 'block';
                testNotifyResult.classList.remove('alert-danger');
                testNotifyResult.classList.add('alert-success');
                testNotifyResult.textContent = "Test notification success: " + JSON.stringify(result);
            } catch (error) {
                console.error("Error with test notification:", error);
                const testNotifyResult = document.getElementById('testNotifyResult');
                testNotifyResult.style.display = 'block';
                testNotifyResult.classList.remove('alert-success');
                testNotifyResult.classList.add('alert-danger');
                testNotifyResult.textContent = "Test notification failed: " + error.message;
            }
        });
    }
    
    // Optionally log notify results from the main process for debugging purposes
    if (window.electronAPI.onNotifyResult) {
        window.electronAPI.onNotifyResult((data) => {
            console.log("Notify result:", data);
        });
    }
}); 