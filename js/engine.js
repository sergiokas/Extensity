ko.extenders.pluckable = function(target, option) {
  // Pluck an iterable by an observable field
  target.pluck = ko.computed(function() {
    return _(target()).map(function(i) { return i[option](); });
  });
};

ko.extenders.toggleable = function(target, option) {
  // Toggles for extension collections
  target.toggle = function() {
    _(target()).each(function(i) { i.toggle(); });
  };
  target.enable = function() {
    _(target()).each(function(i) { i.enable(); });
  };
  target.disable = function() {
    _(target()).each(function(i) { i.disable(); });
  };
};

ko.extenders.persistable = function(target, key) {
  // Persists a single observable (or observableArray) in cloud browser storage
  chrome.storage.sync.get(key, function(v) {

    // Set initial value from storage if present.
    if(v[key]) {
      target(v[key]);
    }

    // Subscribe to changes after initializing the value.
    target.subscribe(function(val) {
      var obj={};
      obj[key]=val; 
      chrome.storage.sync.set(obj);

    });
  });
};

ko.extenders.countable = function(target, option) {
  target.count = ko.computed(function() {
    return target().length;
  });

  target.any = ko.computed(function() {
    return target().length > 0;
  });

  target.many = ko.computed(function() {
    return target().length > 1;
  });

  target.none = ko.computed(function() {
    return target().length == 0;
  });
};

var DismissalsCollection = function() {
  var self = this;

  self.dismissals = ko.observableArray();

  self.dismiss = function(id) {
    self.dismissals.push(id);
  };

  self.dismissed = function(id) {
    return (self.dismissals.indexOf(id) !== -1)
  };

  // Initializer
  chrome.storage.sync.get("dismissals", function(arr) {
    self.dismissals(arr);
    // Subscribe to observables after setting the initial value so we don't re-save the same thing.
    self.dismissals.subscribe(function(a) {
      chrome.storage.sync.set({dismissals: a});
    });
  });
};

var OptionsCollection = function() {
  var self = this;

  // Options and defauts
  var defs = {
    showHeader   : true,
    groupApps    : true,
    appsFirst    : false,
    enabledFirst : false,
    searchBox    : true
  };

  // Define observables.
  _(defs).each(function(def,key) {
    self[key] = ko.observable(def);
  });

  // Save values from all observables.
  self.save = function(callback) {
    chrome.storage.sync.set(
      _(defs).mapObject(function(val, key) { return self[key](); }), callback
    );
  };

  // Set observable values from Chrome Storage
  chrome.storage.sync.get(_(defs).keys(), function(v) {
    _(v).each(function(val, key) {
      self[key](val);
    });
  });

};

var ProfileModel = function(name, items) {
  var self = this;

  self.name = ko.observable(name);
  self.items = ko.observableArray(items);

  self.hasItems = ko.computed(function() {
    return self.items().length > 0;
  });

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),30);
  });

  return this;
};

var ProfileCollectionModel = function() {
  var self = this;

  self.items = ko.observableArray();

  self.any = ko.computed(function() {
    return self.items().length > 0;
  });

  self.add = function(name,items) {
    items = items || [];
    return self.items.push(new ProfileModel(name,items));
  }

  self.find = function(name) {
    return _(self.items()).find(function(i) { return i.name() == name});
  }

  self.remove = function(profile) {
    self.items.remove(profile);
  }

  self.exists = function(name) {
    return !_(self.find(name)).isUndefined();
  }

  self.save = function(callback) {
    var r = {};
    var t = _(self.items()).each(function(i) {
      if (i.name()) {
        r[i.name()] = _(i.items()).uniq();
      }
    });
    chrome.storage.sync.set({profiles: r}, callback);
  };

  chrome.storage.sync.get("profiles", function(p) {
    p = p['profiles'] || {};
    var k = _(p).chain().keys().sortBy().value();
    _(k).each(function(name) {
      self.items.push(new ProfileModel(name, p[name]));
    });
  });

  return this;
}

var ExtensionModel = function(e) {
  var self = this;

  var item = e;

  // Get the smallest available icon.
  var smallestIcon = function(icons) {
    var smallest = _(icons).chain().pluck('size').min().value();
    var icon = _(icons).find({size: smallest});
    return (icon && icon.url) || '';
  };

  self.id = ko.observable(item.id);
  self.name = ko.observable(item.name);
  self.type = item.type;
  self.mayDisable = item.mayDisable;
  self.isApp = ko.observable(item.isApp);
  self.icon = smallestIcon(item.icons);
  self.status = ko.observable(item.enabled);

  self.disabled = ko.pureComputed(function() {
    return !self.status();
  });

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),40);
  })

  self.toggle = function() {
    self.status(!self.status());
  };

  self.enable = function() {
    self.status(true);
  };

  self.disable = function() {
    self.status(false);
  }

  self.status.subscribe(function(value) {
    chrome.management.setEnabled(self.id(), value);
  });

};

var ExtensionCollectionModel = function() {
  var self = this;

  self.items = ko.observableArray();

  var typeFilter = function(types) {
    var all = self.items(); res = [];
    for (var i = 0; i < all.length; i++) {
      if(_(types).includes(all[i].type)) { res.push(all[i]); }
    }
    return res;
  };

  self.extensions = ko.computed(function() {
    return _(typeFilter(['extension'])).filter(function(i) { return i.mayDisable });
  }).extend({pluckable: 'id', toggleable: null});

  self.apps = ko.computed(function() {
    return typeFilter(["hosted_app", "packaged_app", "legacy_packaged_app"]);
  }).extend({pluckable: 'id', toggleable: null});

  // Enabled extensions
  self.enabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Disabled extensions
  self.disabled = ko.pureComputed(function() {
    return _(self.extensions()).filter( function(i) { return !i.status(); });
  }).extend({pluckable: 'id', toggleable: null});

  // Find a single extension model by ud
  self.find = function(id) {
    return _(self.items()).find(function(i) { return i.id()==id });
  };

  // Initialize
  chrome.management.getAll(function(results) {
    _(results).chain()
      .sortBy(function(i) { return i.name.toUpperCase(); })
      .each(function(i){
        if (i.name != "Extensity" && i.type != 'theme') {
          self.items.push(new ExtensionModel(i));
        }
      });
  });

};