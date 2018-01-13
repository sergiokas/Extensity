// Migration from localStorage settings to Chrome Storage sync.

// Helper: remove sync'd storage for testing
// chrome.storage.sync.remove(['profiles', 'showHeader', 'groupApps', 'appsFirst', 'enabledFirst', 'searchBox', 'dismissals', 'toggled']);

// Get the right boolean value.
// Hack to override default string-only localStorage implementation
// http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
function boolean(value) {
  if (value === "true")
    return true;
  else if (value === "false")
    return false;
  else
    return Boolean(value);
};

// Boolean value from localStorage with a default
function b(idx, def) {
  return boolean(localStorage[idx] || def);
};

function migrate_to_chrome_storage() {
  chrome.storage.sync.get("migration", function(v) {
    console.log(v);
    // Only migrate if another migration hasn't been done in a different computer.
    if(v["migration"]) {
      console.log("Migration from localStorage already happened in another computer");
    }
    else {
      console.log("Migrate localStorage data to Chrome Storage Sync");

      // Don't migrate toggles as they're just a temporary per-session value.
      // // Backwards compatibility -- restore old toggled-off format if the new one fails.
      // // Keeping this for a while until everyone upgrades.
      // try {
      //   // New version -- stringified array
      //   var toggled = JSON.parse(localStorage["toggled"] || "[]");
      // } catch(e) {
      //   // Old version -- comma-separated values.
      //   var toggled = (localStorage['toggled'] || "").split(",").filter(function(e){return e;})
      // }

      var data = {
        dismissals:   JSON.parse(localStorage['dismissals'] || "[]"),
        profiles:     JSON.parse(localStorage['profiles'] || "{}"),
        // toggled:      toggled,
        showHeader:   b('showHeader'   , true),
        groupApps:    b('groupApps'    , true),
        appsFirst:    b('appsFirst'    , false),
        enabledFirst: b('enabledFirst' , false),
        searchBox:    b('searchBox'    , true),
        migration:    "1.4.0"
      };
      chrome.storage.sync.set(data, function() {
        // Remove localStorage settings when done.
        localStorage.removeItem('dismissals');
        localStorage.removeItem('profiles');
        localStorage.removeItem('toggled');
        localStorage.removeItem('showHeader');
        localStorage.removeItem('groupApps');
        localStorage.removeItem('appsFirst');
        localStorage.removeItem('enabledFirst');
        localStorage.removeItem('searchBox');
      });
    }
  });
};

// Listeners for the event page.
chrome.runtime.onInstalled.addListener(function(details) {
  if(details["reason"] == 'update' && details["previousVersion"] < "1.4.0") {
      migrate_to_chrome_storage();
  }
});