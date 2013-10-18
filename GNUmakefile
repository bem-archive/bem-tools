BEM = ./bin/bem
BIN = ./node_modules/.bin
MOCHA = $(BIN)/mocha
JSCOV = $(BIN)/coverjs
JSHINT = $(BIN)/jshint

.PHONY: all
all:

.PHONY: clean
clean:
	-rm -rf test-make-temp
	-rm -rf lib-cov
	-rm -rf coverage.html

.PHONY: jshint
jshint:
	$(JSHINT) lib test

.PHONY: test-setup
test-setup:
	@test -e node_modules/bem || ln -s .. node_modules/bem
	@git submodule update --init

.PHONY: test
test: test-setup jshint
	$(MOCHA)

.PHONY: lib-cov
lib-cov:
	-rm -rf lib-cov
	$(JSCOV) --recursive --output lib-cov lib/*

.PHONY: test-cover
test-cover: lib-cov test
	COVER=1 $(MOCHA) --reporter mocha-coverjs > coverage.html
	@echo
	@echo Open ./coverage.html file in your browser

.PHONY: tests
tests:
	-rm -rf tests/level4
	$(BEM) create level -o tests -l simple -T css -T js -t xsl level4
	$(BEM) create -l tests/level4 -T css -T js -t xsl -b first-block
	$(BEM) create -l tests/level4 -b first-block -T css -T js -t xsl -e elem1
	$(BEM) create -l tests/level4 -b first-block -m mod1
	$(BEM) create -l tests/level4 -b first-block -v 1 -m mod1

	-rm -rf tests/level5
	$(BEM) create level -o tests -l tests/level2/.bem/level.js -t css -t css1 -n js -n js1 level5
	$(BEM) create -l tests/level5 -b first-block
	$(BEM) create -l tests/level5 -b second-block -n css1 -e elem2
	$(BEM) create -l tests/level5 -b second-block -m mod2
	$(BEM) create -l tests/level5 -b second-block -e elem2 -v 221 -v 222 -m mod22

	$(BEM) build -d tests/decl.js -o tests -n bla -t deps.js -t ie.css -l tests/level1 -l tests/level2 -l tests/level3 -l tests/level4 -l tests/level5
	$(BEM) build -d tests/bla.deps.js -o tests -n bla -t css -t js -l tests/level1 -l tests/level2 -l tests/level3 -l tests/level4 -l tests/level5

	$(BEM) decl subtract -o tests/deps-subtract.deps.js -d tests/deps-subtract-1.deps.js -d tests/deps-subtract-2.deps.js
	$(BEM) decl merge -o tests/deps-merge.deps.js -d tests/deps-merge-1.deps.js -d tests/deps-merge-2.deps.js
