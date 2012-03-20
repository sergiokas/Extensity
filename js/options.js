/**
 * Preferences
 */
ExtensityOptions = function() {
	var self = this;	
	self.load();
};

// All available options
ExtensityOptions.prototype.settings = [
	'showHeader',	// Show the extensity header in the main popup or now
    'groupApps'		// Group Apps and Extensions before sorting
];

// Default values for options
ExtensityOptions.prototype.defaultValues = {
	showHeader	: true,
	groupApps	: true
};

// Set preferences from localStorage, defaultValues, or null (in that order) 
ExtensityOptions.prototype.load = function () {
	var self = this;
	$(self.settings).each(function(i, item) {
		if(typeof(localStorage[item]) != 'undefined') {
			self[item] = self.boolean(localStorage[item]);
		}
		else if (typeof(self.defaultValues[item]) != 'undefined') { 
			self[item] = self.defaultValues[item];
		}
		else {
			self[item] = null;
		}
	});
};

// Save preferences to localStorage
ExtensityOptions.prototype.save = function () {
	var self = this;
	$(self.settings).each(function(i, item) {
		localStorage[item] = self[item];
	});
};

// Get the right boolean value.
// Hack to override default string-only localStorage implementation
// http://stackoverflow.com/questions/3263161/cannot-set-boolean-values-in-localstorage
ExtensityOptions.prototype.boolean = function(value) {
	if (value == "true") 
		return true;
	else if (value == "false") 
		return false;
	else
		return Boolean(value);
};

/**
 * Configuration page controller.
 */
ExtensityConfigure = function() {
	// Extension name
	this.name = 'ExtensityOptions';	
};

// Configuration page selectors
ExtensityConfigure.prototype.selectors = {
	save		: 'button:#save',
	result		: 'span:#save-result',
	close		: 'a:#close'
};

// Start the configuration page
ExtensityConfigure.prototype.start = function() {
	var self = this;

	self.options = new ExtensityOptions();
	self.restore();
	
	// Capture events
	$(self.selectors.save).live('click', function(ev) {
		self.save();
	});

	$(self.selectors.close).live('click', function(ev) {
		self.close();
	});
};

// Restore configuration from the settings
ExtensityConfigure.prototype.restore = function() {
	var self = this;
	$(self.options.settings).each(function(i, item) {
		$('input:#' + item).prop('checked', Boolean(self.options[item]));
	});
	
};

// Collect configuration options from the UI
ExtensityConfigure.prototype.collect = function() {
	var self = this;
	$(self.options.settings).each(function(i, item) {
		self.options[item] = Boolean($('input:#' + item).attr('checked'));
	});
};


//Close the configuration window
ExtensityConfigure.prototype.save = function() {
	var self = this;
	self.collect();
	self.options.save();
	$(self.selectors.result).text('| Saved!').show().delay(1000).fadeOut('slow');
};

// Close the configuration window
ExtensityConfigure.prototype.close = function() {
	window.close();
};
