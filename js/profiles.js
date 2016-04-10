jQuery(document).ready( function($) {

  var ProfilesViewModel = function() {
    var self = this;

    self.ext = new ExtensionCollectionModel();
    self.profiles = new ProfileCollectionModel();

    self.current_profile = ko.observable();
    self.add_name = ko.observable("");

    self.current_name = ko.pureComputed(function() {
      return (self.current_profile()) ? self.current_profile().name() : null;
    });
    self.current_items = ko.pureComputed(function() {
      return (self.current_profile()) ? self.current_profile().items() : [];
    });

    self.editable = ko.computed(function() {
      return self.current_profile() || false;
    });

    self.select = function(data) {
      self.current_profile(data);
    };

    self.selectByIndex = function(idx) {
      self.current_profile(self.profiles.items()[idx]);
    };

    self.add = function() {
      var n = self.add_name();
      if(n) {
        var p = self.profiles.find(n);
        if(_(p).isUndefined()) {
          self.selectByIndex(
            // Add, by default, currently enabled extensions.
            self.profiles.add(n,self.ext.enabled.pluck()) - 1 
          );
        }
        else {
          self.current_profile(p);
        }
        self.add_name("");
      }
    };

    self.remove = function(profile) {
      var c = (profile == self.current_profile());
      self.profiles.remove(profile);
      if(c) self.selectByIndex(0); // Select first one if removing the current.
    };

    self.save = function() {
      self.profiles.save();
      $('#save-result').text('| Saved!').show().delay(2000).fadeOut('slow');
    };

    self.close = function() { window.close(); }

    self.toggleAll = function() {
      var exts = _(self.ext.extensions()).map(function(i) { return i.id(); });
      self.current_profile().items(exts);
    };

    self.toggleNone = function() {
      if(self.current_profile()) self.current_profile().items([]);
    };

    // Initialize
    try { self.selectByIndex(0); }
    catch(e) { /*No profiles*/ }

  };

  vm = new ProfilesViewModel();

  ko.bindingProvider.instance = new ko.secureBindingsProvider({});
  ko.applyBindings(vm, document.getElementById('profiles'));

});