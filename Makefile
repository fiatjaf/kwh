all: build

icons: static/icon64.png static/icon128.png static/icon48.png static/icon16.png
build: icons static/inpage-bundle.js static/content-bundle.js static/background-bundle.js static/popup-bundle.js static/options-bundle.js static/style.css

static/icon%.png: icon.png
	convert icon.png -resize $*x$* $@

static/background-bundle.js: src/background.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/content-bundle.js: src/content.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/inpage-bundle.js: src/inpage.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/popup-bundle.js: src/popup.js $(shell find src/components/)
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/options-bundle.js: src/options.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/style.css: src/style.styl
	./node_modules/.bin/stylus < $< > $@

pack.zip: build
	cd static/ && \
        zip -r pack * && \
        mv pack.zip ../

sources.zip: build
	rm -fr tmpsrc/
	mkdir -p tmpsrc
	cd static && \
        cp -r icon.png *.html *.js tmpsrc/
	cd tmpsrc/ && \
        zip -r sources * && \
        mv sources.zip ../
