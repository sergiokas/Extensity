var OptionsModel = function() {

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
  })

  return this;
};

var ProfileCollectionModel = function() {
  var self = this;

  self.items = ko.observableArray();

  self.hasProfiles = ko.computed(function() {
    return self.items().length > 0;
  });

  self.add = function(name) {
    return self.items.push(new ProfileModel(name,[]));
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
    localStorage['profiles'] = JSON.stringify(r);
  };

  // Load from localStorage on init.
  // console.log(localStorage["profiles"]);
  var p = JSON.parse(localStorage["profiles"] || "{}");
  _(p).each(function(i,idx) {
    if(idx) {
      self.items.push(new ProfileModel(idx, i));
    }
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
  self.isApp = item.isApp;
  self.icon = smallestIcon(item.icons);
  self.status = ko.observable(item.enabled);

  self.short_name = ko.computed(function() {
    return _.str.prune(self.name(),40);
  })

  // TODO: define some actions

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

  self.extensions = ko.pureComputed(function() {
    return typeFilter(['extension']);
  }, self);

  self.apps = ko.pureComputed(function() {
    return typeFilter(["hosted_app", "packaged_app", "legacy_packaged_app"]);
  }, self);

  chrome.management.getAll(function(results) {
    _(results).chain().sortBy("name").each(function(i){
      if (i.name != "Extensity" && i.type != 'theme') {
        self.items.push(new ExtensionModel(i));
      }
    });
  });

};