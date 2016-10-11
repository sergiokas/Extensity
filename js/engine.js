//Init data from chrome.storage.sync
var toggled = [];
var profiles = [];
var dismissals = [];
var showHeader = true;
var groupApps = true;
var appsFirst = false;
var enabledFirst = false;

function loadData(){
  $.holdReady(true);
  return new Promise(function(resolve, reject){
    chrome.storage.sync.get(["toggled", "dismissals", "showHeader", "groupApps", "appsFirst" , "enabledFirst" , "profiles"], function(v){
      toggled = v.toggled;
      profiles =  v.profiles;
      dismissals = v.dismissals;
      showHeader = v.showHeader;
      groupApps = v.groupApps;
      appsFirst = v.appsFirst;
      enabledFirst = v.enabledFirst;
      $.holdReady(false);
      resolve();
    });
  });
}
loadData();

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

var DismissalsCollection = function() {
  var self = this;

  self.dismissals = ko.observableArray(dismissals);

  self.dismissals.subscribe(function(v) {
    //localStorage['dismissals'] = JSON.stringify(v);
    chrome.storage.sync.set({"dismissals": v});
  });

  self.dismiss = function(id) {
    self.dismissals.push(id);
  };

  self.dismissed = function(id) {
    return (self.dismissals.indexOf(id) !== -1)
  };

}

var OptionsCollection = function() {
  var self = this;

  self.showHeader     = ko.observable(showHeader);
  self.groupApps      = ko.observable(groupApps);
  self.appsFirst      = ko.observable(appsFirst);
  self.enabledFirst   = ko.observable(enabledFirst);

  self.save = function() {
    chrome.storage.sync.set(
      {
        "showHeader": self.showHeader(),
        "groupApps": self.groupApps(),
        "appsFirst": self.appsFirst(),
        "enabledFirst": self.enabledFirst()
      }
    );
    /*localStorage['showHeader'] = self.showHeader();
    localStorage['groupApps'] = self.groupApps();
    localStorage['appsFirst'] = self.appsFirst();
    localStorage['enabledFirst'] = self.enabledFirst();*/
  };

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

  self.save = function() {
    var r = {};
    var t = _(self.items()).each(function(i) {
      if (i.name()) {
        r[i.name()] = _(i.items()).uniq();
      }
    });
    chrome.storage.sync.set({"profiles": r});
  };

  // Load profiles.
  var p = profiles;
  var k = _(p).chain().keys().sortBy().value();
  _(k).each(function(name) {
    self.items.push(new ProfileModel(name, p[name]));
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