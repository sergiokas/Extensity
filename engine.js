Extensity = function() {
	// Extension name
	this.name = 'Extensity';
	
	// Cache for extensions
	this.cache = {
		'extensions': []
	};
	
	
	
};

// jQuery selectors
Extensity.prototype.selectors = {
	list				: 	'#content #list',
	trigger				: 	'.extension-trigger',
	triggerElements		: 	'img,span'
};

// jQuery templates
Extensity.prototype.templates = {
	item 	: '#ExtensionItem-tpl'
};

// CSS classes
Extensity.prototype.classes = {
	enabled 	: 'extension-status-enabled',
	disabled	: 'extension-status-disabled'
};


Extensity.prototype.start = function() {
	var self = this;
	
	self.captureEvents();
	self.reload( function() { 
		self.refreshList(); 
	});	
};

// Reload the extensions list
Extensity.prototype.reload = function( callback ) {
	var self = this;
	chrome.management.getAll( function( results ) {
		self.cache.extensions = results;
		self.cache.extensions.sort( function(a,b) {
			return self.sortExtensionsCacheAlpha(a, b);
		});
		if( typeof( callback ) == 'function' ) {
			callback();
		}
	});
	
};

// Refresh extensions list
Extensity.prototype.refreshList = function() {
	var self = this;

	// Clean content first
	$(self.selectors.list).html('');
	
	// Append extensions
	$(self.cache.extensions).each( function(i,item) {

		// Make sure we don't disable ourselves.
		if( item.name != self.name ) {
			$(self.templates.item)
			.tmpl({
				item: item, 
				options: {
					icon: self.getSmallestIconUrl(item.icons),
					statusClass: (item.enabled) ? self.classes.enabled : self.classes.disabled
				}
			})
			.appendTo( self.selectors.list );			
		}
	});
};


//Refresh extensions list
Extensity.prototype.captureEvents = function() {
	var self = this;
	
	// Capture triggers
	$(self.selectors.list).find(self.selectors.trigger).live( 'click', function(ev) {
		self.toggleExtension(ev.target.id);
	});
	
	// Capture triggers inner elements
	$(self.selectors.list).find(self.selectors.trigger).find(self.selectors.triggerElements).live( 'click', function(ev) {
		self.toggleExtension( $(ev.target).parent().attr('id') );
	});
	
	
};

Extensity.prototype.sortExtensionsCacheAlpha = function (a, b) {
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
Extensity.prototype.toggleExtension = function (id) {
	var self = this;
	var extension = self.getExtension(id);
	// Make sure we found the extension.
	if( extension ) {
		chrome.management.setEnabled( id, !extension.enabled, function() {
			self.reload( function() { 
				self.refreshList(); 
			});	
		});
	}
};