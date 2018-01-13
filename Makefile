# Primitive makefile for including just required files in the distribution.
# @requires jsmin (http://www.crockford.com/javascript/jsmin.html)
# @requires zip
FILES=index.html options.html profiles.html manifest.json
DIRS=images styles js fonts
DIST=dist
JS=engine.js index.js options.js profiles.js migration.js
CSS=index.css options.css normalize.css

dist: clean copy minify pack

copy:
	@echo "### Copying files"
	cp -R $(DIRS) $(FILES) $(DIST)

minify: $(JS) $(CSS)
	@echo "### Minification complete"

%.js:
	cat $(DIST)/js/$@ | jsmin > $(DIST)/js/$@.minify
	mv $(DIST)/js/$@.minify $(DIST)/js/$@

%.css:
	lessc -x $(DIST)/styles/$@ > $(DIST)/styles/$@.minify
	mv $(DIST)/styles/$@.minify $(DIST)/styles/$@

pack:
	@echo "### Packing..."
	find $(DIST) -name '.DS_Store' | xargs rm
	cd $(DIST); zip -r dist.zip *

clean:
	rm -rf $(DIST)/*
