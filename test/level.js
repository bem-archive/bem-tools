/* jshint quotmark: false */
'use strict';

var assert = require('chai').assert,
    UTIL = require('util'),
    BEM = require('..'),
    PATH = BEM.require('./path'),
    createLevel = BEM.createLevel;

/**
 * Mocha BDD interface.
 *
 * @name describe @function
 * @name it @function
 * @name before @function
 * @name after @function
 * @name beforeEach @function
 * @name afterEach @function
 */

describe('level', function() {

    describe("Level('data/level1') /* generic level */", function() {

        var level = createLevel(absolute('data/level1'));

        describe(".getDefaultTechs()", function() {
            it("returns empty array", function() {
                var defs = level.getDefaultTechs();
                assert.isArray(defs);
                assert.lengthOf(defs, 0);
            });
        });

        /*
        TODO: think if these tests still actual?

        it(".resolveTechPath('../../techs/test.js') resolves", function() {
            assert.equal(level.resolveTechPath('../../techs/test.js'), absolute('./data/techs/test.js'));
        });

        it(".resolveTechPath('/path/to/techs/test.js') resolves", function() {
            var path = absolute('./data/techs/test.js');
            assert.equal(level.resolveTechPath(path), path);
        });

        it(".resolveTechPath('data/techs/test.js') resolves", function() {
            var path = 'data/techs/test.js';
            assert.equal(level.resolveTechPath(absolute(path)), path);
        });
        */

        describe(".getByObj()", function() {
            it("block, elem, mod, val", function() {
                var item = {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val'
                };
                assert.equal(level.getByObj(item), PATH.resolve(level.dir, 'block/__elem/_mod/block__elem_mod_val'));
            });
        });

        describe(".getRelByObj()", function() {
            it("block, elem, mod, val", function() {
                var item = {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val'
                };
                assert.equal(level.getRelByObj(item), 'block/__elem/_mod/block__elem_mod_val');
            });
        });

        describe(".getPath()", function() {
            it("block/block, css", function() {
                assert.equal(level.getPath('block/block', 'css'), 'block/block.css');
            });
        });

        describe(".getPathByObj()", function() {
            it("block: block", function() {
                assert.equal(level.getPathByObj({ block: 'block' }, 'css'), PATH.resolve(level.dir, 'block/block.css'));
            });
        });

        describe(".getRelPathByObj()", function() {
            it("block: block", function() {
                assert.equal(level.getRelPathByObj({ block: 'block' }, 'css'), 'block/block.css');
            });
        });

        describe(".matchAny()", function() {

            var abs = PATH.resolve(level.dir, 'block/block.css');
            it(abs, function() {
                assert.deepEqual(level.matchAny(abs), {
                    block: 'block',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/block.css', function() {
                assert.deepEqual(level.matchAny('block/block.css'), {
                    block: 'block',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/_mod/block_mod.css', function() {
                assert.deepEqual(level.matchAny('block/_mod/block_mod.css'), {
                    block: 'block',
                    mod: 'mod',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/_mod/block_mod_val.css', function() {
                assert.deepEqual(level.matchAny('block/_mod/block_mod_val.css'), {
                    block: 'block',
                    mod: 'mod',
                    val: 'val',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/__elem/block__elem.css', function() {
                assert.deepEqual(level.matchAny('block/__elem/block__elem.css'), {
                    block: 'block',
                    elem: 'elem',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/__elem/_mod/block__elem_mod.css', function() {
                assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod.css'), {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/__elem/_mod/block__elem_mod_val.css', function() {
                assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod_val.css'), {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block/__elem/_mod/block__elem_mod_val.custom', function() {
                assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod_val.custom'), {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val',
                    suffix: '.custom',
                    tech: undefined
                });
            });

        });

        describe(".getDeclByIntrospection()", function() {
            it("returns correct introspection", function() {
                assert.deepEqual(level.getDeclByIntrospection(), [ {
                    name: 'first-block',
                    elems: [ {
                        name: 'elem1',
                        mods: [ {
                            name: 'mod2',
                            techs: [ { name: 'css' } ],
                            vals: [ {
                                name: '3',
                                techs: [ { name: 'js' } ]
                            } ]
                        } ]
                    } ]
                } ]);
            });
        });

        describe(".createIntrospector() default introspector call", function() {
            it("returns correct introspection", function() {
                assert.deepEqual(level.createIntrospector()().sort(function(a, b) {
                    if (a.tech < b.tech) return -1;
                    if (a.tech > b.tech) return 1;
                    return 0;
                }), [
                    {
                        block: 'first-block',
                        elem: 'elem1',
                        mod: 'mod2',
                        suffix: '.css',
                        tech: 'css'
                    },
                    {
                        block: 'first-block',
                        elem: 'elem1',
                        mod: 'mod2',
                        val: '3',
                        suffix: '.js',
                        tech: 'js'
                    }
                ]);
            });
        });

        describe(".match-*()", function() {
            level.matchOrder().forEach(function(matcher) {

                if (matcher === 'block-all' || matcher === 'elem-all') return;

                var args = matcher.split('-'),
                    match;
                if(args[0] !== 'block') args.unshift('block');
                match = level.match(matcher, level.getRel(matcher, args));

                it(UTIL.format("matcher '%s' complies to getter", matcher), function() {
                    Object.keys(match).forEach(function(key) {
                        assert.isString(match[key]);
                        if(key === 'suffix') {
                            assert.equal(match[key], '');
                            return;
                        }
                        assert.equal(match[key], key);
                    });
                });

            });

        });

        describe(".match-*-all()", function() {

            var blockData = ['elem',
                             'elem-mod',
                             'elem-mod-val',
                             '',
                             'block',
                             'block-mod',
                             'block-mod-val'],
                matcher = 'elem-all';

            blockData.forEach(function(block) {
                if (block === '') {
                    matcher = 'block-all';
                    return;
                }

                var args = block.split('-');
                if (args[0] !== 'block') args.unshift('block');

                var match = level.match(matcher, level['get-' + block].apply(this, args));

                it(UTIL.format("matcher '%s' complies to getter with %s data", matcher, block), testMatch(match));

            }, this);

            // generate test function for matchs and vars to check equality to
            function testMatch(match, vars) {

                vars = vars || {};

                return function() {
                    Object.keys(match).forEach(function(key) {
                        assert.isString(match[key]);
                        if(key === 'suffix') {
                            assert.equal(match[key], '');
                            return;
                        }
                        assert.equal(match[key], vars[key] || key);
                    });
                };

            }

        });
        
    });

});

function absolute(path) {
    return PATH.resolve(__dirname, path);
}
