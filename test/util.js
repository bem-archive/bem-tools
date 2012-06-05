var assert = require('chai').assert,
    U = require('../lib/util'),
    PATH = require('../lib/path');

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

    describe('getBemTechPath()', function() {

        it("'css' resolves to 'bem/lib/techs/css'", function() {
            assert.equal(U.getBemTechPath('css'), PATH.unixToOs('bem/lib/techs/css'));
        });

        it("'custom' resolves to 'bem/lib/tech'", function() {
            assert.equal(U.getBemTechPath('custom'), PATH.unixToOs('bem/lib/tech'));
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

});
