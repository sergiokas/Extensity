Extensity = function() {
	// Extension name
	this.name = 'Extensity';
	// Exclude certain types from the list
	this.exclude_types = ['theme'];

	// Cache for extensions
	this.cache = {
		extensions: [],
		options: new ExtensityConfiguration()
	};
};

// jQuery selectors
Extensity.prototype.selectors = {
	header:	'#header',
	list: '#content #list'
};

// New templates. Replaced to avoid code generation from strings in new Chrome extensions.
Extensity.prototype.templates = {
	// Parameters are: section name
	section: '<div class="extension-section"><span>%s</span></div>',
	// Parameters are: statusClass, item id, icon, item name
	extensionItem: '<a class="extension-item extension-trigger %s" id="%s" href="#"><img src="%s" width="16px" height="16px" /> <span>%s</span></a>',
	appItem: '<a class="extension-item %s extension-trigger" id="%s" href="#"><img src="%s" width="16px" height="16px" /> <span>%s</span></a>',
	filterBox: '<input class="filter-input filter-trigger" type="text" id="filter" placeholder="Search Extensions">'
};

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

	// Make sure we start at the top.
	$(document).scrollTop(0);
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
	var list = $('#list');

	// Clean content first
	list.html('');

	// Checking config and append FilterBox
	if(self.cache.options.filterBox)
	{
		list.append(self.addFilterBox());
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
			list.append(self.addListItem(item));
		}
	});

	self.captureEvents();
};

// Update CSS for a single list item
Extensity.prototype.updateListItem = function(id, status) {
	var self = this;
	$("#list .extension-item#"+id).toggleClass(self.classes.disabled, status);
};


// Exclude certain items from the list
Extensity.prototype.shouldExcludeFromList = function(item) {
	var self = this;
	// Filter out ourselves
	// Filter out themes
	return (item.name == self.name) || (item.type && self.exclude_types.indexOf(item.type)>=0);
};

Extensity.prototype.filterExtensions = function(filterText) {
	filterText = filterText || '';
	filterText = filterText.toLowerCase();

	$('.extension-trigger').each(function() {
		var $item = $(this);
		var itemName = $item.find('span').text().toLowerCase();

		if(filterText === '' || _.str.include(itemName, filterText))
		{
			$item.removeClass('hide');
		}
		else
		{
			$item.addClass('hide')
		}
	});
};

// Add filter input box
Extensity.prototype.addFilterBox = function() {
	var self = this;
	return _(self.templates.filterBox).sprintf();
};

// Add an item to the list
Extensity.prototype.addListItem = function(item) {
	var self = this;
	return _((item.isApp)?self.templates.extensionItem:self.templates.appItem).sprintf(
		(item.enabled) ? self.classes.enabled : self.classes.disabled, // Status class
		item.id,
		self.getSmallestIconUrl(item.icons),
		_(item.name).prune(35)
	);
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
	var actions = $(self.selectors.header).find('#actions a');
	actions.off();
	// Required because we'll need to load local resources (chrome://extensions)
	actions.on('click', function(ev, a) {
		ev.preventDefault();
		self.openPageTab(this.href);
	});
};


//Refresh extensions list
Extensity.prototype.captureEvents = function() {
	var self = this;

	$('.extension-trigger').off();
	$('.extension-trigger').find('img,span').off();

	// Capture triggers
	$('.extension-trigger').on('click', function(ev) {
		ev.preventDefault();
		self.triggerExtension(ev.target.id);
	});

	// Capture triggers content
	$('.extension-trigger').find('img,span').on('click', function(ev) {
		ev.preventDefault();
		$(this).parent().trigger('click');
	});

	if(self.cache.options.filterBox)
	{
		$('.filter-trigger').off();
		$('.filter-trigger').on('keyup', function(ev) {
			var inputVal = $(this).val();
			self.filterExtensions(inputVal);
		});
	}
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

// Launch an app
Extensity.prototype.launchApp = function (id) {
	var self = this;
	chrome.management.launchApp(id);
	// Remove the popup after launching.
	self.hide();
};
