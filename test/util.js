/* jshint quotmark: false */
'use strict';

var assert = require('chai').assert,
    BEM = require('..'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path');

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

describe('util', function() {

    var bemLib = process.env.COVER? 'bem/lib-cov/' : 'bem/lib/';

    describe('getBemTechPath()', function() {

        it("'css' resolves to 'bem/lib/techs/css'", function() {
            assert.equal(U.getBemTechPath('css'), PATH.unixToOs(bemLib + 'techs/css.js'));
        });

        it("'css' resolves to 'bem/lib/techs/v2/css' when opts.version === 2", function () {
            assert.equal(U.getBemTechPath('css', {version: 2}),
                         PATH.unixToOs(bemLib + 'techs/v2/css.js'));
        });

        it("'level-proto' resolves to 'bem/lib/techs/v2/level-proto.js'", function () {
            assert.equal(U.getBemTechPath('level-proto'),
                        PATH.unixToOs(bemLib + 'techs/v2/level-proto.js'));
        });

        it("'custom' resolves to 'bem/lib/tech'", function() {
            assert.equal(U.getBemTechPath('custom'), PATH.unixToOs(bemLib + 'tech'));
        });

        it("throws an error when unable to resolve tech and throwWhenUnresolved===true", function() {
            assert.throws(function() {
                U.getBemTechPath('custom', {throwWhenUnresolved: true});
            });
        });

    });

    describe('isRequireable()', function() {

        it("'path' returns true", function() {
            assert.isTrue(U.isRequireable('path'));
        });

        it("'unexistent-module' returns false", function() {
            assert.isFalse(U.isRequireable('unexistent-module'));
        });

    });

    describe('isPath()', function() {

        it("'/path/to/file' returns true", function() {
            assert.isTrue(U.isPath(PATH.unixToOs('/path/to/file')));
        });

        it("'./path/to/file' returns true", function() {
            assert.isTrue(U.isPath('.' + PATH.unixToOs('/path/to/file')));
        });

        it("'path/to/file' returns true", function() {
            assert.isTrue(U.isPath(PATH.unixToOs('path/to/file')));
        });

        it("'file' returns false", function() {
            assert.isFalse(U.isPath('file'));
        });

        it("'file.ext' returns false", function() {
            assert.isFalse(U.isPath('file.ext'));
        });

    });

    describe('bemParseKey()', function() {

        it('block', function() {
            assert.deepEqual(U.bemParseKey('block'), { block: 'block' });
        });

        it('block_mod', function() {
            assert.deepEqual(U.bemParseKey('block_mod'), { block: 'block', mod: 'mod' });
        });

        it('block_mod_val', function() {
            assert.deepEqual(U.bemParseKey('block_mod_val'), {
                block: 'block',
                mod: 'mod',
                val: 'val'
            });
        });

        it('block__elem', function() {
            assert.deepEqual(U.bemParseKey('block__elem'), { block: 'block', elem: 'elem' });
        });

        it('block__elem_mod', function() {
            assert.deepEqual(U.bemParseKey('block__elem_mod'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod'
            });
        });

        it('block__elem_mod_val', function() {
            assert.deepEqual(U.bemParseKey('block__elem_mod_val'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                val: 'val'
            });
        });

        it('block.css', function() {
            assert.deepEqual(U.bemParseKey('block.css'), { block: 'block', tech: 'css' });
        });

        it('block.decl.js', function() {
            assert.deepEqual(U.bemParseKey('block.decl.js'), { block: 'block', tech: 'decl.js' });
        });

        it('block_mod.css', function() {
            assert.deepEqual(U.bemParseKey('block_mod.css'), {
                block: 'block',
                mod: 'mod',
                tech: 'css'
            });
        });

        it('block_mod_val.css', function() {
            assert.deepEqual(U.bemParseKey('block_mod_val.css'), {
                block: 'block',
                mod: 'mod',
                val: 'val',
                tech: 'css'
            });
        });

        it('block__elem.css', function() {
            assert.deepEqual(U.bemParseKey('block__elem.css'), {
                block: 'block',
                elem: 'elem',
                tech: 'css'
            });
        });

        it('block__elem_mod.css', function() {
            assert.deepEqual(U.bemParseKey('block__elem_mod.css'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                tech: 'css'
            });
        });

        it('block__elem_mod_val.css', function() {
            assert.deepEqual(U.bemParseKey('block__elem_mod_val.css'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                val: 'val',
                tech: 'css'
            });
        });

    });

});
