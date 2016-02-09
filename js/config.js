/**
 * Configuration Options
 */
ExtensityConfiguration = function() {
	var self = this;
	// Set available settings from defaults
	self.settings = _(self.defaults).keys();
	self.load();
};

// Available configuration options and their default values
ExtensityConfiguration.prototype.defaults = {
	showHeader: true,
	includeApps: true,
	groupApps: true,
	appsFirst: false
};

// Set preferences from localStorage, defaults, or null (in that order)
ExtensityConfiguration.prototype.load = function () {
	var self = this;
	$(self.settings).each(function(i, item) {
		if(typeof(localStorage[item]) != 'undefined') {
			self[item] = self.boolean(localStorage[item]);
		}
		else if (typeof(self.defaults[item]) != 'undefined') {
			self[item] = self.defaults[item];
		}
		else {
			self[item] = null;
		}
	});
};

// Save preferences to localStorage
ExtensityConfiguration.prototype.save = function () {
	var self = this;
	$(self.settings).each(function(i, item) {
		localStorage[item] = self[item];
	});
};

// Get the right boolean value.
// Hack to override default string-only localStorage implementation
// http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
ExtensityConfiguration.prototype.boolean = function(value) {
	if (value === "true")
		return true;
	else if (value === "false")
		return false;
	else
		return Boolean(value);
};
