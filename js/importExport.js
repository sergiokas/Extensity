// Wait for the DOM to fully load before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {

  // 🔹 EXPORT PROFILES FROM chrome.storage.sync
  const exportBtn = document.getElementById('exportSettings');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {

      // Fetch 'profiles' from Chrome's sync storage
      chrome.storage.sync.get(['profiles'], (data) => {

        // If no profiles exist, alert the user and exit
        if (!data.profiles || Object.keys(data.profiles).length === 0) {
          alert('!No profiles found to export.');
          return;
        }

        // Convert profiles data to a JSON blob
        const blob = new Blob(
          [JSON.stringify(data.profiles, null, 2)],
          { type: 'application/json' }
        );

        // Create a temporary download link for the JSON file
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `extensity-profiles-${dateStr}.json`;  // Dynamic filename
        a.click();  // Trigger the download
        URL.revokeObjectURL(url);  // Clean up the URL
      });
    });
  }

  // 🔹 TRIGGER IMPORT FILE SELECTOR
  const importBtn = document.getElementById('importSettings');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      // Simulate a click on the hidden file input
      document.getElementById('importFile').click();
    });
  }

  // 🔹 HANDLE FILE INPUT CHANGE (IMPORT PROFILES)
  const importFileInput = document.getElementById('importFile');
  if (importFileInput) {
    importFileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) return;  // Exit if no file is selected

      const reader = new FileReader();

      // When file is successfully read
      reader.onload = function (e) {
        try {
          const importedProfiles = JSON.parse(e.target.result);

          // Validate the imported data
          if (!importedProfiles || typeof importedProfiles !== 'object') {
            alert('! Invalid or corrupt file.');
            return;
          }

          // Save imported profiles into Chrome's sync storage
          chrome.storage.sync.set({ profiles: importedProfiles }, () => {

            // Show a success message in the UI, if available
            const msg = document.getElementById('save-result');
            if (msg) {
              msg.classList.remove('hidden');
              msg.textContent = '| Profiles imported!';
              setTimeout(() => msg.classList.add('hidden'), 3000);
            } else {
              alert(':) Profiles imported! Please reload Extensity.');
            }
          });

        } catch (err) {
          // Handle JSON parsing errors
          alert('! Failed to parse JSON file.');
        }
      };

      // Start reading the file as text
      reader.readAsText(file);
    });
  }
});
