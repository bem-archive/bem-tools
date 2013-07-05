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

    describe("Level('data/level-simple') /* simple level */", function() {

        var level = createLevel(absolute('data/level-simple'));

        describe(".getByObj()", function() {

            it("block, elem, mod, val", function() {
                var item = {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val'
                };
                assert.equal(level.getByObj(item), PATH.resolve(level.dir, 'block__elem_mod_val'));
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
                assert.equal(level.getRelByObj(item), 'block__elem_mod_val');
            });

        });

        describe(".matchAny()", function() {

            var abs = PATH.resolve(level.dir, 'block.css');
            it(abs, function() {
                assert.deepEqual(level.matchAny(abs), {
                    block: 'block',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block.css', function() {
                assert.deepEqual(level.matchAny('block.css'), {
                    block: 'block',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block_mod.css', function() {
                assert.deepEqual(level.matchAny('block_mod.css'), {
                    block: 'block',
                    mod: 'mod',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block_mod_val.css', function() {
                assert.deepEqual(level.matchAny('block_mod_val.css'), {
                    block: 'block',
                    mod: 'mod',
                    val: 'val',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block__elem.css', function() {
                assert.deepEqual(level.matchAny('block__elem.css'), {
                    block: 'block',
                    elem: 'elem',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block__elem_mod.css', function() {
                assert.deepEqual(level.matchAny('block__elem_mod.css'), {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block__elem_mod_val.css', function() {
                assert.deepEqual(level.matchAny('block__elem_mod_val.css'), {
                    block: 'block',
                    elem: 'elem',
                    mod: 'mod',
                    val: 'val',
                    suffix: '.css',
                    tech: 'css'
                });
            });

            it('block__elem_mod_val.custom', function() {
                assert.deepEqual(level.matchAny('block__elem_mod_val.custom'), {
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
                    }

                ]);
            });
        });

        describe(".match-*()", function() {

            level.matchOrder().forEach(function(matcher) {

                if (matcher === 'elem-all' || matcher === 'block-all') return;

                var args = matcher.split('-'),
                    match;

                // test simple match
                if(args[0] !== 'block') args.unshift('block');
                match = level.match(matcher, level.getRel(matcher, args));

                it(UTIL.format("matcher '%s' complies to getter", matcher), testMatch(match));

                // generate test function for matches and vars to check equality to
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
