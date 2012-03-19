Extensity = function() {
	// Extension name
	this.name = 'Extensity';
	
	// Cache for extensions
	this.cache = {
		'extensions': [],
		'options'	: new ExtensityOptions()
	};
};

// Relevant URLs
Extensity.prototype.pages = {
	rate			: 'https://chrome.google.com/webstore/detail/jjmflmamggggndanpgfnpelongoepncg',
	twitter		: 'http://twitter.com/share?url=https://chrome.google.com/webstore/detail/jjmflmamggggndanpgfnpelongoepncg&via=ExtensityChrome&text=Keep control of your Chrome extensions with Extensity. Quickly enable/disable any extension!',
	extensions 	: 'chrome://extensions/',
	options		: 'options.html'
};

// jQuery selectors
Extensity.prototype.selectors = {
	header			:	'#header',
	list				: 	'#content #list',
	trigger			: 	'.extension-trigger',
	triggerElements	: 	'img,span',
	rate				:	'img:#rate',
	twitter			:	'img:#twitter',	
	extensions		:	'img:#extensions',
	options			:	'img:#options',	
	close			:	'img:#close'
};

// jQuery templates
Extensity.prototype.templates = {
	section 			: "#Section-tpl",
	extensionItem 	: '#ExtensionItem-tpl',
	appItem			: '#AppItem-tpl'
};

// CSS classes
Extensity.prototype.classes = {
	enabled 	: 'extension-status-enabled',
	disabled	: 'extension-status-disabled'
};


Extensity.prototype.start = function() {
	var self = this;

	if( !self.cache.options.showHeader ) {
		$(self.selectors.header).hide();
	}
	
	self.captureEvents();
	self.reload( function() { 
		self.refreshList(); 
	});	
	
	// Make sure we start at the top.
	$(document).scrollTop(0);
};

// Reload the extensions list
Extensity.prototype.reload = function( callback ) {
	var self = this;
	chrome.management.getAll( function( results ) {
		self.cache.extensions = results;
		
		// Sort the extensions list 
		self.cache.extensions.sort( function(a,b) {
			if( self.cache.options.groupApps )
				return self.sortExtensionsCacheGroup(a, b);
			else
				return self.sortExtensionsCacheAlpha(a, b);
		});
		
		// Run the callback if available
		if( typeof( callback ) == 'function' ) {
			callback();
		}
	});
	
};

// Refresh extensions list
Extensity.prototype.refreshList = function() {
	var self = this;
	var currentSection = '';
	var hasMultipleExtensionTypes = self.hasMultipleExtensionTypes();
	
	// Clean content first
	$(self.selectors.list).html('');
	
	// Append extensions
	$(self.cache.extensions).each( function(i,item) {
		// Make sure we don't include ourselves in the list (trying to disable will hang up Chrome)
		if( item.name != self.name ) 
		{
			// Add list section if required
			
			if( hasMultipleExtensionTypes && self.cache.options.groupApps && currentSection != self.getListSectionName(item) ) {
				self.addListSection( item );
				currentSection = self.getListSectionName(item);
			}		
			// Add the item
			self.addListItem( item );
		}
	});
};

// Add an item to the list
Extensity.prototype.addListItem = function( item ) {
	var self = this;
	$((item.isApp)?self.templates.extensionItem:self.templates.appItem)
		.tmpl({
			item: item, 
			options: {
				icon: self.getSmallestIconUrl(item.icons),
				statusClass: (item.enabled) ? self.classes.enabled : self.classes.disabled
			}
		})
		.appendTo( self.selectors.list );			
};

//Add an section header to the list
Extensity.prototype.addListSection = function( item ) {
	var self = this;
	$(self.templates.section)
		.tmpl({section: self.getListSectionName(item)})
		.appendTo(self.selectors.list);
};


// Get section name
Extensity.prototype.getListSectionName = function ( item ) {
	return (item.isApp)?'Apps':'Extensions';
};

//Refresh extensions list
Extensity.prototype.captureEvents = function() {
	var self = this;
	
	// Capture triggers
	$(self.selectors.list).find(self.selectors.trigger).live('click', function(ev) {
		console.log('clicked');
		ev.preventDefault();
		self.triggerExtension(ev.target.id);
	});
	
	// Capture triggers inner elements
	$(self.selectors.list).find(self.selectors.trigger).find(self.selectors.triggerElements).live( 'click', function(ev) {
		ev.preventDefault();
		$(ev.target).parent().click();
	});
	
	// Capture header events
	$(self.selectors.header).find(self.selectors.extensions).live('click', function(ev) {
		ev.preventDefault();
		self.openPageTab( self.pages.extensions );
	});
	
	$(self.selectors.header).find(self.selectors.options).live('click', function(ev) {
		ev.preventDefault();
		self.openPageTab( self.pages.options );
	});		

	$(self.selectors.header).find(self.selectors.rate).live('click', function(ev) {
		ev.preventDefault();
		self.openPageTab( self.pages.rate );
	});		

	$(self.selectors.header).find(self.selectors.twitter).live('click', function(ev) {
		ev.preventDefault();
		self.openPageTab( self.pages.twitter );
	});			
};

// Open Chrome Extensions page
Extensity.prototype.openPageTab = function ( page ) {
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
	if( a.isApp && !b.isApp ) 
		return 1;
	else if (b.isApp && !a.isApp )
		return -1;
	else
		return self.sortExtensionsCacheAlpha(a, b);
};

// Sort Extensions Alphabetically 
Extensity.prototype.sortExtensionsCacheAlpha = function (a, b) {
	var self = this;
	if (a.name.toLowerCase() < b.name.toLowerCase() ) 
		return -1;
	else if ( a.name.toLowerCase() > b.name.toLowerCase() )
		return 1;
	else
		return 0;		
};

// Get the smallest icon URL available for a given extension.
Extensity.prototype.getSmallestIconUrl = function( icons ) {
	var smallest = null;
	var url = "";
	if( typeof icons != 'undefined' ) {
		$(icons).each( function(i, icon) {
			if( typeof(icon.size) != 'undefined' ) {
				if( smallest == null || icon.size < smallest ) {
					smallest = icon.size;
					url = icon.url;
				} 
			}
		});
	}
	return url;
};

// Has more than one kind of app / extension 
Extensity.prototype.hasMultipleExtensionTypes = function() {
	var self = this;
	var hasApps = false;
	var hasExtensions = false;
	$(self.cache.extensions).each( function(i, item) {
		hasExtensions |= ! Boolean(item.isApp);
		hasApps	|= Boolean(item.isApp);
	});
	
	return (hasApps && hasExtensions);
};

// Get extension by id, from the cache.
Extensity.prototype.getExtension = function (id) {
	var self = this;
	var extension = null;
	$(self.cache.extensions).each( function(i, item) {
		if (item.id == id ) {
			extension = item;
		}
	});
	return extension;
};

// Toggle Extension status
Extensity.prototype.triggerExtension = function (id) {
	var self = this;
	var extension = self.getExtension(id);
	// Make sure we found the extension.
	if( extension ) {
		if( !extension.isApp ) {
			self.toggleExtension(id, !extension.enabled );
		}
		else {
			self.launchApp( id );
		}
	}
};

// Set the enabled/disabled status of an extension
Extensity.prototype.toggleExtension = function (id, status) {
	var self = this;
	chrome.management.setEnabled( id, status, function() {
		self.reload( function() { 
			self.refreshList(); 
		});	
	});	
};

// Launch an app
Extensity.prototype.launchApp = function (id) {
	var self = this;
	chrome.management.launchApp( id );
	// Remove the popup after launching.
	self.hide();
};
