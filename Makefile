all: build

icons: static/icon64.png static/icon128.png static/icon48.png static/icon16.png

static/icon%.png: icon.png
	convert icon.png -resize $*x$* $@

static/background_script.js: background.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/inpage_script.js: inpage.js
	./node_modules/.bin/browserifyinc $< -dv --outfile $@

static/style.css: style.styl
	./node_modules/.bin/stylus < style.styl > static/style.css

build: icons static/inpage_script.js static/background_script.js static/style.css

pack.zip: build
	cd static/ && \
        zip -r pack * && \
        mv pack.zip ../

sources.zip: $(shell find icon.png *.html *.js)
	rm -fr tmpsrc/
	mkdir -p tmpsrc
	cp -r icon.png *.html *.js tmpsrc/
	cd tmpsrc/ && \
        zip -r sources * && \
        mv sources.zip ../
