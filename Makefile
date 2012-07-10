# Primitive makefile for including just required files in the distribution.
# @requires jsmin (http://www.crockford.com/javascript/jsmin.html)
# @requires zip
FILES=index.html options.html manifest.json
DIST=dist
DIRS=images styles js

dist: clean copy minify pack

copy:
	@echo "### Copying files..." 
	@cp -R $(DIRS) $(FILES) $(DIST)

minify:
	@echo "### Minifying JS..."
	@cat $(DIST)/js/index.js | jsmin > $(DIST)/js/index.min.js
	@cat $(DIST)/js/config.js | jsmin > $(DIST)/js/config.min.js
	@cat $(DIST)/js/engine.js | jsmin > $(DIST)/js/engine.min.js
	@cat $(DIST)/js/options.js | jsmin > $(DIST)/js/options.min.js
	@mv $(DIST)/js/index.min.js $(DIST)/js/index.js
	@mv $(DIST)/js/config.min.js $(DIST)/js/config.js
	@mv $(DIST)/js/engine.min.js $(DIST)/js/engine.js
	@mv $(DIST)/js/options.min.js $(DIST)/js/options.js

pack:
	@echo "### Packing..."
	@cd $(DIST); zip -r dist.zip *

clean:
	@rm -rf $(DIST)/*
