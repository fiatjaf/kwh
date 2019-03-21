all: build

icons: static/icon64.png static/icon128.png static/icon48.png static/icon16.png static/icon64-active.png static/icon128-active.png static/icon48-active.png static/icon16-active.png
build: icons static/webln-bundle.js static/content-bundle.js static/background-bundle.js static/popup-bundle.js static/options-bundle.js static/style.css

static/icon%.png: icon.png
	convert $< -resize $*x$* $@

static/icon%-active.png: icon-active.png
	convert $< -resize $*x$* $@

static/background-bundle.js: src/background.js src/predefined-behaviors.js src/current-action.js src/utils.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/content-bundle.js: src/content.js src/utils.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/webln-bundle.js: src/webln.js src/utils.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/popup-bundle.js: src/popup.js $(shell find src/components/)
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/options-bundle.js: src/options.js src/utils.js
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
