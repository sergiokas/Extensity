var OptionsModel = function() {

};

var ProfileModel = function(name, items) {
  var self = this;

  self.name = ko.observable(name);
  self.items = ko.observableArray(items);

  self.hasItems = ko.computed(function() {
    return self.items().length > 0;
  });

  return this;
};

var ProfilesListModel = function() {
  var self = this;

  self.items = ko.observableArray();

  self.hasProfiles = ko.computed(function() {
    return self.items().length > 0;
  });

  self.save = function() {
    var r = {};
    var t = _(self.items()).each(function(i) {
      if (i.name()) {
        r[i.name()] = i.items();
      }
    });
    localStorage['profiles'] = r;
  };

  // Load from localStorage on init.
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
  self.name = item.name;
  self.type = item.type;
  self.isApp = item.isApp;
  self.icon = smallestIcon(item.icons);
  self.status = ko.observable(item.enabled);
  // TODO: define some actions.
};

var ExtensionsListModel = function() {
  var self = this;

  self.list = ko.observableArray();

  var typeFilter = function(types) {
    var all = self.list(); res = [];
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
        self.list.push(new ExtensionModel(i));
      }
    });
  });

};