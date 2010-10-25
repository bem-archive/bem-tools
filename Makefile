test:
	-rm -rf tests/level4
	./bin/bem create level -o tests -l simple -T css -T js -t xsl level4
	./bin/bem create block -l tests/level4 -T css -T js -t xsl first-block
	#./bin/bem create elem -l tests/level4 -b first-block -T css -T js -t xsl elem1
	#./bin/bem create mod -l tests/level4 -b first-block mod1
	#./bin/bem create mod -l tests/level4 -b first-block -v 1 mod1

	-rm -rf tests/level5
	./bin/bem create level -o tests -l tests/level2/.bem/level.js -t css -t css1 -n js -n js1 level5
	./bin/bem create block -l tests/level5 first-block
	#./bin/bem create elem -l tests/level5 -b second-block -n css1 elem2
	#./bin/bem create mod -l tests/level5 -b second-block mod2
	#./bin/bem create mod -l tests/level5 -b second-block -e elem2 -v 221 -v 222 mod22

	./bin/bem build -d tests/decl.js -o tests -n bla -t css -t js -l tests/level1 -l tests/level2 -l tests/level3 -l tests/level4 -l tests/level5
