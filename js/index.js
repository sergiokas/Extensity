jQuery(document).ready( function($) {

  var SwitchViewModel = function(exts) {
    var self = this;

    var init = [];

    // Backwards compatibility -- restore old toggled-off format if the new one fails.
    // Keeping this for a while until everyone upgrades.
    try {
      // New version -- stringified array
      init = JSON.parse(localStorage["toggled"] || "[]");
    } catch(e) {
      // Old version -- comma-separated values.
      init = (localStorage['toggled'] || "").split(",").filter(function(e){return e;})
    }

    self.toggled = ko.observableArray(init);
    self.exts = exts;

    self.toggled.subscribe(function(val) {
      localStorage["toggled"] = JSON.stringify(val);
    });

    self.any = ko.computed(function() {
      return self.toggled().length > 0;
    });

    self.flip = function() {
      if(self.any()) {
        // Re-enable
        _(self.toggled()).each(function(id) {
          // Old disabled extensions may be removed
          try{ self.exts.find(id).enable();} catch(e) {};
        });
        self.toggled([]);
      } else {
        // Disable
        self.toggled( self.exts.enabled.pluck() );
        self.exts.enabled.disable();
      };
    };

  };

  var ExtensityViewModel = function() {
    var self = this;

    self.profiles = new ProfileCollectionModel();
    self.exts = new ExtensionCollectionModel();
    self.opts = new OptionsCollection();
    self.dismissals = new DismissalsCollection();
    self.switch = new SwitchViewModel(self.exts);

    self.openChromeExtensions = function() {
      openTab("chrome://extensions");
    };

    self.launchApp = function(app) {
      chrome.management.launchApp(app.id());
    };

    self.setProfile = function(p) {
      var ids = p.items();
      var to_enable = _.intersection(self.exts.disabled.pluck(),ids);
      var to_disable = _.difference(self.exts.enabled.pluck(), ids);
      _(to_enable).each(function(id) { self.exts.find(id).enable() });
      _(to_disable).each(function(id) { self.exts.find(id).disable() });
    };

    // Private helper functions
    var openTab = function (url) {
      chrome.tabs.create({url: url});
      close();
    };

    var close = function() {
      window.close();
    };

    // View helpers
    var visitedProfiles = ko.computed(function() {
      return (self.dismissals.dismissed("profile_page_viewed") || self.profiles.any());
    });

  };

  vm = new ExtensityViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.body);

});