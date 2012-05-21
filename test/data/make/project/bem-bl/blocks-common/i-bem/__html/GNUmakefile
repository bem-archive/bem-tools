
all: lib

src: $(patsubst %.ometajs,%.ometajs.js,$(wildcard src/*.ometajs))

%.ometajs.js: %.ometajs
	ometajs2js -i $< -o $@

lib: lib/bemhtml.js

lib/bemhtml.js: src
	-rm $@
	for i in \
			bemhtml.js \
			bemhtml.ometajs.js \
		; do \
			cat $</$$i >> $@ \
		; done

tests: $(subst .bemhtml,,$(wildcard tests/*.bemhtml))

tests/%:
	node tests/tests.js tests/$*.bemhtml

.PHONY: all FORCE
