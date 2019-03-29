all: build

icons: static/icon64.png static/icon128.png static/icon48.png static/icon16.png static/icon64-active.png static/icon128-active.png static/icon48-active.png static/icon16-active.png
build: icons static/webln-bundle.js static/content-bundle.js static/background-bundle.js static/popup-bundle.js static/options-bundle.js static/style.css

static/icon%.png: icon.png
	convert $< -resize $*x$* $@

static/icon%-active.png: icon-active.png
	convert $< -resize $*x$* $@

targets = static/background-bundle.js static/content-bundle.js static/webln-bundle.js static/options-bundle.js static/popup-bundle.js

$(targets): static/%-bundle.js: src/%.js src/utils.js src/browser.js
	echo ">>> building $<"
	./node_modules/.bin/rollup -c rollup.config.js -i $< -o tmp-rolluped.js
	./node_modules/.bin/browserify tmp-rolluped.js -dv --outfile $@
	rm tmp-rolluped.js

static/style.css: src/style.styl
	./node_modules/.bin/stylus < $< > $@

extension.zip: build
	cd static/ && \
        zip -r pack * && \
        mv extension.zip ../

sources.zip: build
	rm -fr tmpsrc/
	mkdir -p tmpsrc
	mkdir -p tmpsrc/src
	mkdir -p tmpsrc/static
	cd static && \
        cp -r *.html ../tmpsrc/static/
	cd src && \
        cp -r *.js ../tmpsrc/src
	cp *.png package.json Makefile README.md tmpsrc/
	cd tmpsrc/ && \
        zip -r sources * && \
        mv sources.zip ../
