jQuery(document).ready( function($) {
	// Mix in underscore string exports
	_.mixin(_.string.exports());
	Engine = new Extensity();
	Engine.start(); 	
});
