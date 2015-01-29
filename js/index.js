jQuery(document).ready( function($) {
	// Mix in underscore string exports
	_.mixin(_.string.exports());
	(new Extensity()).start();
});
