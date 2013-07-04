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

    describe("Level('data/level-nested') /* nested level */", function() {

        var level = createLevel(absolute('data/level-nested'));

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

            it("path/to/block, elem, mod, val", function() {
                var item = {
                    block: 'path/to/block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val'
                };
                assert.equal(level.getByObj(item), PATH.resolve(level.dir, 'path/to/block/__elem/_mod/block__elem_mod_val'));
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

            it("path/to/block, elem, mod, val", function() {
                var item = {
                    block: 'path/to/block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val'
                };
                assert.equal(level.getRelByObj(item), 'path/to/block/__elem/_mod/block__elem_mod_val');
            });

        });

        describe(".matchAny()", function() {

            var abs1 = PATH.resolve(level.dir, 'block/block.css');
            it(abs1, function() {
                assert.deepEqual(level.matchAny(abs1), {
                    block: 'block',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            var abs2 = PATH.resolve(level.dir, 'path/to/block/block.css');
            it(abs2, function() {
                assert.deepEqual(level.matchAny(abs2), {
                    block: 'path/to/block',
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

            it('path/to/block/block.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/block.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/_mod/block_mod.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/_mod/block_mod.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/_mod/block_mod_val.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/_mod/block_mod_val.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/__elem/block__elem.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/__elem/block__elem.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/__elem/_mod/block__elem_mod.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/__elem/_mod/block__elem_mod.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/__elem/_mod/block__elem_mod_val.css', function() {
                assert.deepEqual(level.matchAny('path/to/block/__elem/_mod/block__elem_mod_val.css'), {
                    block: 'path/to/block',
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

            it('path/to/block/__elem/_mod/block__elem_mod_val.custom', function() {
                assert.deepEqual(level.matchAny('path/to/block/__elem/_mod/block__elem_mod_val.custom'), {
                    block: 'path/to/block',
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
                assert.deepEqual(level.getDeclByIntrospection(), [

                    {
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
                    },

                    {
                        name: 'path/to/first-block',
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
                    }

                ]);
            });
        });

        describe(".match-*()", function() {

            level.matchOrder().forEach(function(matcher) {

                var args = matcher.split('-'),
                    match, nestedMatch, block;

                if (matcher === 'elem-all' || matcher === 'block-all') return;

                // test simple match
                if(args[0] !== 'block') args.unshift('block');
                match = level.match(matcher, level.getRel(matcher, args));

                it(UTIL.format("matcher '%s' complies to getter", matcher), testMatch(match));

                // test nested blocks match
                block = PATH.join.apply(null, ['path', 'to', 'block']);
                args[0] = block;
                nestedMatch = level.match(matcher, level.getRel(matcher, args));

                it(UTIL.format("matcher '%s' complies to getter (nested)", matcher), testMatch(nestedMatch, { block: block }));

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

});

function absolute(path) {
    return PATH.resolve(__dirname, path);
}
