test:
	-rm -rf tests/level4
	./bin/bem create level -o tests -l simple level4
	touch tests/level4/first-block_mod1.css
	touch tests/level4/first-block_mod1_1.js
	-rm -rf tests/level5
	./bin/bem create level -o tests -l tests/level2/.bem/level.js level5
	touch tests/level5/first-block_mod1_2.css

	./bin/bem build -d tests/decl.js -o tests -n bla -t css -t js -l tests/level1 -l tests/level2 -l tests/level3 -l tests/level4 -l tests/level5
