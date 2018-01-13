// Migration from localStorage settings to Chrome Storage sync.

// chrome.storage.sync.remove(['profiles', 'showHeader', 'groupApps', 'appsFirst', 'enabledFirst', 'searchBox']);

// Get the right boolean value.
// Hack to override default string-only localStorage implementation
// http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
var boolean = function(value) {
  if (value === "true")
    return true;
  else if (value === "false")
    return false;
  else
    return Boolean(value);
};

// Boolean value from localStorage with a default
var b = function(idx, def) {
  return boolean(localStorage[idx] || def);
};

function migrate_to_chrome_storage() {
  var data = {
    profiles:     JSON.parse(localStorage["profiles"] || "{}"),
    showHeader:   b('showHeader'   , true),
    groupApps:    b('groupApps'    , true),
    appsFirst:    b('appsFirst'    , false),
    enabledFirst: b('enabledFirst' , false),
    searchBox:    b('searchBox'    , true)
  }
  chrome.storage.sync.set(data);
}

chrome.runtime.onInstalled.addListener(function(details) {
  if(details["reason"] == 'update' && details["previousVersion"] < "1.4.0") {
      migrate_to_chrome_storage();
  }
});