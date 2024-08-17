# Primitive makefile for including just required files in the distribution.
FILES=index.html options.html profiles.html manifest.json
DIRS=images styles js fonts
DIST=dist
JS=engine.js index.js options.js profiles.js migration.js
CSS=index.css options.css normalize.css
JSMIN=uglifyjs --compress --mangle
CSSMIN=csso

dist: clean copy minify pack

copy:
	@echo "### Copying files"
	cp -R $(DIRS) $(FILES) $(DIST)

minify: $(JS) $(CSS)
	@echo "### Minification complete"

%.js:
	cat $(DIST)/js/$@ | $(JSMIN) > $(DIST)/js/$@.minify
	mv $(DIST)/js/$@.minify $(DIST)/js/$@

%.css:
	cat $(DIST)/styles/$@ | $(CSSMIN) > $(DIST)/styles/$@.minify
	mv $(DIST)/styles/$@.minify $(DIST)/styles/$@

pack:
	@echo "### Packing..."
	find $(DIST) -name '.DS_Store' | xargs rm
	cd $(DIST); zip -r dist.zip *

clean:
	rm -rf $(DIST)
	mkdir dist
