Extensity = function() {
	// Extension name
	this.name = 'Extensity';
	// Exclude certain types from the list
	this.exclude_types = ['theme'];

	// Cache for extensions
	this.cache = {
		extensions: [],
		toggled: (localStorage['toggled'] || "").split(",").filter(function(e){return e;}),
		options: new ExtensityConfiguration()
	};
};

// jQuery selectors
Extensity.prototype.selectors = {
	header:	'#header',
	list: '#content'
};

// New templates. Replaced to avoid code generation from strings in new Chrome extensions.
Extensity.prototype.templates = {
	// Parameters are: section name
	section: '<h1>%s</h1><ul></ul>',
	// Parameters are: statusClass, item id, icon, item name
	extensionItem: '<li class="%s" id="%s"><img src="%s" width="16px" height="16px" /> %s</li>',
	appItem: '<li class="%s" id="%s"><img src="%s" width="16px" height="16px" /> %s</li>'

	// extensionItem: '<a class="extension-item extension-trigger %s" id="%s" href="#"><img src="%s" width="16px" height="16px" /> <span>%s</span></a>',
	// appItem: '<a class="extension-item %s extension-trigger" id="%s" href="#"><img src="%s" width="16px" height="16px" /> <span>%s</span></a>'
}

// CSS classes
Extensity.prototype.classes = {
	enabled: '',
	disabled: 'disabled'
};

Extensity.prototype.start = function() {
	var self = this;

	if(!self.cache.options.showHeader) {
		$(self.selectors.header).hide();
	}

	self.captureHeaderEvents();
	self.reload(function() {
		self.refreshList();
	});
};

// Reload the extensions list
Extensity.prototype.reload = function(callback) {
	var self = this;
	chrome.management.getAll(function(results) {
		self.cache.extensions = results;

		// Sort the extensions list
		self.cache.extensions.sort(function(a,b) {
			if(self.cache.options.groupApps && self.cache.options.appsFirst)
				return self.sortExtensionsCacheGroupAppsFirst(a, b);
			else if(self.cache.options.groupApps)
				return self.sortExtensionsCacheGroup(a, b);
			else
				return self.sortExtensionsCacheAlpha(a, b);
		});

		// Run the callback if available
		if(typeof(callback) === 'function') {
			callback();
		}
	});

};

// Refresh extensions list
Extensity.prototype.refreshList = function() {
	var self = this;
	var currentSection = null;
	var hasMultipleExtensionTypes = self.hasMultipleExtensionTypes();
	var list = $(self.selectors.list);
	// Clean content first
	list.html('');

	if(!self.cache.options.groupApps) {
		list.append("<ul></ul>")
	}

	// Append extensions
	$(self.cache.extensions).each(function(i,item) {
		// Make sure we don't include ourselves in the list (trying to disable will hang up Chrome)
		if(!self.shouldExcludeFromList(item))
		{
			// Add list section if required
			if(hasMultipleExtensionTypes && self.cache.options.groupApps && currentSection != self.getListSectionName(item)) {
				list.append(self.addListSection(item));
				currentSection = self.getListSectionName(item);
			}
			// Add the item
			list.find("ul:last-child").append(self.addListItem(item));
		}
	});

	self.captureEvents();
};

// Update CSS for a single list item
Extensity.prototype.updateListItem = function(id, status) {
	var self = this;
	$("#content li#"+id).toggleClass(self.classes.disabled, status);
};


// Exclude certain items from the list
Extensity.prototype.shouldExcludeFromList = function(item) {
	var self = this;
	// Filter out ourselves
	// Filter out themes
	return (item.name == self.name) || (item.type && self.exclude_types.indexOf(item.type)>=0);
};

// Add an item to the list
Extensity.prototype.addListItem = function(item) {
	var self = this;
	return _((item.isApp)?self.templates.extensionItem:self.templates.appItem).sprintf(
		(item.enabled) ? self.classes.enabled : self.classes.disabled, // Status class
		item.id,
		self.getSmallestIconUrl(item.icons),
		_(item.name).prune(35)
	)
};

//Add an section header to the list
Extensity.prototype.addListSection = function(item) {
	var self = this;
	return _(self.templates.section).sprintf(self.getListSectionName(item));
};


// Get section name
Extensity.prototype.getListSectionName = function (item) {
	return (item.isApp) ? 'Apps' : 'Extensions';
};

Extensity.prototype.captureHeaderEvents = function() {
	var self = this;
	var actions = $(self.selectors.header).find('a.page');
	var switches = $(self.selectors.header).find('a.switch');
	actions.off();
	switches.off();
	// Required because we'll need to load local resources (chrome://extensions)
	actions.on('click', function(ev, a) {
		ev.preventDefault();
		self.openPageTab(this.href);
	});
	switches.on('click', function(ev, a) {
		ev.preventDefault();
		self[this.id]();
	})
};

Extensity.prototype.setHeaderStatuses = function() {
	var self = this;
	// Lightbulb state in the header
	$(self.selectors.header).find('#toggleOff.switch').toggleClass(
		'off', Boolean(self.cache.toggled.length>0)
	);
};


//Refresh extensions list
Extensity.prototype.captureEvents = function() {
	var self = this;

	// $("#content li, #content li img").off();
	$("#content li").on('click', function(ev) {
		ev.preventDefault();
		self.triggerExtension(ev.target.id);
	});

	$("#content li img").on('click', function(ev) {
		ev.preventDefault();
		$(this).parent().click();
	});

	self.setHeaderStatuses();
};

// Open a new tab
Extensity.prototype.openPageTab = function (page) {
	var self = this;
	chrome.tabs.create({url: page});
	self.hide();
};

// Hide the extension
Extensity.prototype.hide= function () {
	window.close();
};

// Sort Extensions by Group
Extensity.prototype.sortExtensionsCacheGroup = function (a, b) {
	var self = this;
	if(a.isApp && !b.isApp)
		return 1;
	else if (b.isApp && !a.isApp)
		return -1;
	else
		return self.sortExtensionsCacheAlpha(a, b);
};

// Sort Extensions by group, showing apps first
Extensity.prototype.sortExtensionsCacheGroupAppsFirst = function (a, b) {
	var self = this;
	if(a.isApp && !b.isApp)
		return -1;
	else if (b.isApp && !a.isApp)
		return 1;
	else
		return self.sortExtensionsCacheAlpha(a, b);
};


// Sort Extensions Alphabetically
Extensity.prototype.sortExtensionsCacheAlpha = function (a, b) {
	if (a.name.toLowerCase() < b.name.toLowerCase())
		return -1;
	else if (a.name.toLowerCase() > b.name.toLowerCase())
		return 1;
	else
		return 0;
};

// Get the smallest icon URL available for a given extension.
Extensity.prototype.getSmallestIconUrl = function(icons) {
	var smallest = _(icons).chain().pluck('size').min().value();
	var icon = _(icons).find({size: smallest});
	return (icon && icon.url) || '';
};

// Has more than one kind of app / extension
Extensity.prototype.hasMultipleExtensionTypes = function() {
	var self = this;
	return _(self.cache.extensions).chain()
					.pluck('isApp').unique()
					.value().length>1;
};

// Get extension by id, from the cache.
Extensity.prototype.getExtension = function (id) {
	var self = this;
	return _(self.cache.extensions).find({id: id});
};

// Get a list of all turned on (or off) extensions
Extensity.prototype.getEnabledExtensions = function (enabled) {
	var self = this;
	return _(self.cache.extensions).filter(function(e){
		return e.type == 'extension' && e.enabled == enabled && !self.shouldExcludeFromList(e);
	});
};

// Toggle Extension status
Extensity.prototype.triggerExtension = function (id) {
	var self = this;
	var extension = self.getExtension(id);
	// Make sure we found the extension.
	if(extension) {
		if(!extension.isApp && extension.mayDisable) {
			self.toggleExtension(id, !extension.enabled);
		}
		else if (extension.isApp) {
			self.launchApp(id);
		}
	}
};

// Set the enabled/disabled status of an extension
Extensity.prototype.toggleExtension = function (id, status) {
	var self = this;
	chrome.management.setEnabled(id, status, function() {
		// Reload required to refresh the extension cache.
		self.reload(function() {
			// Do not re-draw the entire interface
			self.updateListItem(id, !status);
		});
	});
};

// Toggle all extensions off, or back on.
Extensity.prototype.toggleOff = function() {
	var self = this;
	if(self.cache.toggled.length>0) {
		// Re-enable all disabled extensions, then clear the list.
		_(self.cache.toggled).each(function(i,idx) {
			if(self.getExtension(i)) { // Make sure extension is still there after a while.
				self.toggleExtension(i, true);
			}
		});
		localStorage["toggled"] = self.cache.toggled = [];
	}
	else {
		// Store all enabled extensions, then disable all of them.
		localStorage["toggled"] = self.cache.toggled = _(self.getEnabledExtensions(true)).pluck("id");
		_(self.cache.toggled).each(function(i,idx) { self.toggleExtension(i, false); });
	}
	self.setHeaderStatuses();
};

// Launch an app
Extensity.prototype.launchApp = function (id) {
	var self = this;
	chrome.management.launchApp(id);
	// Remove the popup after launching.
	self.hide();
};