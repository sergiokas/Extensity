document.addEventListener("DOMContentLoaded", function () {
  let SearchViewModel = function () {
    let self = this;
    self.q = ko.observable("");
  };

  let SwitchViewModel = function (exts, profiles, opts) {
    let self = this;

    self.exts = exts;
    self.profiles = profiles;
    self.opts = opts;
    self.toggled = ko.observableArray().extend({ persistable: "toggled" });

    self.any = ko.computed(function () {
      return self.toggled().length > 0;
    });

    self.toggleStyle = ko.pureComputed(function () {
      return self.any() ? "fa-toggle-off" : "fa-toggle-on";
    });

    let disableFilterFn = function (item) {
      if (!self.opts.keepAlwaysOn()) return true;
      return !_(self.profiles.always_on().items()).contains(item.id());
    };

    self.flip = function () {
      if (self.any()) {
        _(self.toggled()).each(function (id) {
          try {
            self.exts.find(id).enable();
          } catch (e) {}
        });
        self.toggled([]);
      } else {
        self.toggled(self.exts.enabled.pluck());
        self.exts.enabled.disable(disableFilterFn);
      }
    };
  };

  let ExtensityViewModel = function () {
    let self = this;

    self.profiles = new ProfileCollectionModel();
    self.exts = new ExtensionCollectionModel();
    self.opts = new OptionsCollection();
    self.dismissals = new DismissalsCollection();
    self.switch = new SwitchViewModel(self.exts, self.profiles, self.opts);
    self.search = new SearchViewModel();
    self.activeProfile = ko.observable().extend({ persistable: "activeProfile" });

    let filterFn = function (i) {
      if (!self.opts.searchBox()) return true;
      if (!self.search.q()) return true;
      return i.name().toUpperCase().indexOf(self.search.q().toUpperCase()) !== -1;
    };

    let filterProfileFn = function (i) {
      return self.opts.showReserved() || !i.reserved();
    };

    let nameSortFn = function (i) {
      return i.name().toUpperCase();
    };

    let statusSortFn = function (i) {
      return !i.status();
    };

    self.openChromeExtensions = function () {
      openTab("chrome://extensions");
    };

    self.launchApp = function (app) {
      chrome.management.launchApp(app.id());
    };

    self.exportExtensionNames = function () {
      chrome.management.getAll(function (extensions) {
        let chromeExtensions = [];
        let edgeExtensions = [];
        let unknownExtensions = [];

        extensions.forEach(function (ext) {
          let homepageUrl = ext.homepageUrl ? ext.homepageUrl : "No URL available";
          let installSource =
            ext.installType === "normal" ? "User Installed" : "Externally Installed";

          let extensionInfo = `${ext.name} - ${homepageUrl} (${installSource})`;

          if (homepageUrl.includes("chrome.google.com/webstore")) {
            chromeExtensions.push(extensionInfo);
          } else if (homepageUrl.includes("microsoftedge.microsoft.com/addons")) {
            edgeExtensions.push(extensionInfo);
          } else {
            unknownExtensions.push(extensionInfo);
          }
        });

        let data = "Chrome Web Store Extensions:\n\n";
        data += chromeExtensions.length > 0 ? chromeExtensions.join("\n") : "No extensions found.";
        data += "\n\nEdge Add-ons Store Extensions:\n\n";
        data += edgeExtensions.length > 0 ? edgeExtensions.join("\n") : "No extensions found.";
        data += "\n\nOther Source Extensions:\n\n";
        data +=
          unknownExtensions.length > 0 ? unknownExtensions.join("\n") : "No extensions found.";

        let blob = new Blob([data], { type: "text/plain" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;

        let today = new Date();
        let dd = String(today.getDate()).padStart(2, "0");
        let mm = String(today.getMonth() + 1).padStart(2, "0");
        let yyyy = String(today.getFullYear());
        let formattedDate = dd + "-" + mm + "-" + yyyy;

        let filename = formattedDate + "-extensions.txt";
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };

    self.removeItem = function (item, event) {
      event.stopPropagation();
      if (item.isApp()) {
        chrome.management.uninstall(item.id(), { showConfirmDialog: true }, function () {
          self.listedApps.remove(item);
        });
      } else {
        chrome.management.uninstall(item.id(), { showConfirmDialog: true }, function () {
          self.listedExtensions.remove(item);
        });
      }
    };

    self.checkInstallationSource = function () {
      chrome.management.getAll(function (extensions) {
        extensions.forEach(function (ext) {
          let installSource;

          switch (ext.installType) {
            case "normal":
              installSource = "Safe";
              break;
            case "development":
              installSource = "Development";
              break;
            case "sideload":
              installSource = "Sideloaded by Another App";
              break;
            case "admin":
              installSource = "Installed by Enterprise Policy";
              break;
            case "other":
              installSource = "Other";
              break;
            default:
              installSource = "Unknown";
          }

          console.log(`Extension: ${ext.name}, Installation Source: ${installSource}`);
        });
      });
    };

    self.launchOptions = function (ext) {
      chrome.tabs.create({ url: ext.optionsUrl(), active: true });
    };

    self.listedExtensions = ko
      .computed(function () {
        return self.opts.enabledFirst()
          ? _(self.exts.extensions())
              .chain()
              .sortBy(nameSortFn)
              .sortBy(statusSortFn)
              .filter(filterFn)
              .value()
          : _(self.exts.extensions()).filter(filterFn);
      })
      .extend({ countable: null });

    self.listedApps = ko
      .computed(function () {
        return _(self.exts.apps()).filter(filterFn);
      })
      .extend({ countable: null });

    self.listedItems = ko
      .computed(function () {
        return _(self.exts.items()).filter(filterFn);
      })
      .extend({ countable: null });

    self.listedProfiles = ko
      .computed(function () {
        return _(self.profiles.items()).filter(filterProfileFn);
      })
      .extend({ countable: null });

    self.emptyItems = ko.pureComputed(function () {
      return self.listedApps.none() && self.listedExtensions.none();
    });

    self.setProfile = function (p) {
      self.activeProfile(p.name());
      let ids = _.union(p.items(), self.profiles.always_on().items());
      let to_enable = _.intersection(self.exts.disabled.pluck(), ids);
      let to_disable = _.difference(self.exts.enabled.pluck(), ids);
      _(to_enable).each(function (id) {
        self.exts.find(id).enable();
      });
      _(to_disable).each(function (id) {
        self.exts.find(id).disable();
      });
    };

    self.unsetProfile = function () {
      self.activeProfile(undefined);
    };

    self.toggleExtension = function (e) {
      e.toggle();
      self.unsetProfile();
    };

    let openTab = function (url) {
      chrome.tabs.create({ url: url });
      close();
    };

    let close = function () {
      window.close();
    };

    let visitedProfiles = ko.computed(function () {
      return self.dismissals.dismissed("profile_page_viewed") || self.profiles.any();
    });

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    const dangerousPermissions = [
      "tabs",
      "webNavigation",
      "webRequest",
      "webRequestBlocking",
      "history",
      "bookmarks",
      "nativeMessaging",
      "cookies",
      "management",
      "downloads",
      "privacy",
      "sessions",
      "topSites",
      "clipboardRead",
      "clipboardWrite",
      "geolocation",
    ];
    const warningPermissions = [
      "identity",
      "idle",
      "notifications",
      "background",
      "alarms",
      "storage",
      "unlimitedStorage",
      "proxy",
      "fileSystem",
      "network",
      "identity.email",
      "tabs",
      "topSites",
      "wallpaper",
      "tts",
      "ttsEngine",
      "browsingData",
    ];

    self.showPermissions = function (ext) {
      chrome.management.get(ext.id(), function (extensionInfo) {
        const iconElement = document.getElementById("permissionsIcon");
        iconElement.src = extensionInfo.icons[0].url;

        const titleElement = document.getElementById("permissionsTitle");
        titleElement.textContent = extensionInfo.name;
        titleElement.href = extensionInfo.homepageUrl;
        titleElement.style.textDecorationColor = "white";

        document.getElementById("dangerousList").innerHTML = "";
        document.getElementById("warningList").innerHTML = "";
        document.getElementById("safeList").innerHTML = "";

        extensionInfo.permissions.forEach(function (permission) {
          permission = capitalizeFirstLetter(permission);
          const permissionBadge = `<span class="badge ${getBadgeClass(
            permission
          )}">${permission}</span>`;

          if (dangerousPermissions.includes(permission.toLowerCase())) {
            document.getElementById("dangerousList").innerHTML += permissionBadge;
          } else if (warningPermissions.includes(permission.toLowerCase())) {
            document.getElementById("warningList").innerHTML += permissionBadge;
          } else {
            document.getElementById("safeList").innerHTML += permissionBadge;
          }
        });

        const modal = document.getElementById("permissionsModal");
        const span = document.getElementsByClassName("close")[0];
        // Ensure modal is displayed
        modal.style.display = "block";
        // Close the modal when the user clicks on <span> (x)
        span.onclick = function () {
          modal.style.display = "none";
        };
        // Close the modal when the user clicks anywhere outside of the modal
        window.onclick = function (event) {
          if (event.target == modal) {
            modal.style.display = "none";
          }
        };
      });
    };

    function getBadgeClass(permission) {
      if (dangerousPermissions.includes(permission.toLowerCase())) {
        return "badge-danger";
      } else if (warningPermissions.includes(permission.toLowerCase())) {
        return "badge-warning";
      } else {
        return "badge-safe";
      }
    }
    self.checkInstallationSource();
  };

  _.defer(function () {
    vm = new ExtensityViewModel();
    ko.bindingProvider.instance = new ko.secureBindingsProvider({});
    ko.applyBindings(vm, document.body);
  });

  window.setTimeout(function () {
    document.getElementById("workaround-307912").style.display = "block";
  }, 0);
});
