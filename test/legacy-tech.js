var assert = require('chai').assert,
    Tech = require('../lib/legacy-tech.js').Tech,
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

describe('legacy tech', function() {

    describe("new Tech('../lib/legacy-techs/css')", function() {

        var tech = new Tech(require.resolve('../lib/legacy-techs/css'));

        it(".getTechName() equals to 'css'", function() {
            assert.equal(tech.getTechName(), 'css');
        });

        it(".fileByPrefix('file') equals to 'file.css'", function() {
            assert.equal(tech.fileByPrefix('file'), 'file.css');
        });

        it(".matchSuffix('.css') returns true", function() {
            assert.isTrue(tech.matchSuffix('.css'));
        });

        it(".getTechRelativePath() resolves to 'bem/lib/legacy-techs/css'", function() {
            assert.equal(tech.getTechRelativePath(), PATH.unixToOs('bem/lib/legacy-techs/css'));
        });

    });

    describe("new Tech('../lib/legacy-techs/default', 'def')", function() {

        var tech = new Tech(require.resolve('../lib/legacy-techs/default'), 'def');

        it(".getTechName() equals to 'def'", function() {
            assert.equal(tech.getTechName(), 'def');
        });

        it(".fileByPrefix('file') equals to 'file.def'", function() {
            assert.equal(tech.fileByPrefix('file'), 'file.def');
        });

        it(".matchSuffix('.def') returns true", function() {
            assert.isTrue(tech.matchSuffix('.def'));
        });

        it(".getTechRelativePath() resolves to 'bem/lib/legacy-techs/default'", function() {
            assert.equal(tech.getTechRelativePath(), PATH.unixToOs('bem/lib/legacy-techs/default'));
        });

    });

    describe("new Tech('./data/techs/test.js')", function() {

        var tech = new Tech(require.resolve('./data/techs/test.js'));

        it(".getTechName() equals to 'test.js'", function() {
            assert.equal(tech.getTechName(), 'test.js');
        });

        it(".fileByPrefix('file') equals to 'file.test.js'", function() {
            assert.equal(tech.fileByPrefix('file'), 'file.test.js');
        });

        it(".matchSuffix('.test.js') returns true", function() {
            assert.isTrue(tech.matchSuffix('.test.js'));
        });

        it(".getTechRelativePath('./') resolves to './data/techs/test.js'", function() {
            assert.equal(tech.getTechRelativePath(__dirname), PATH.unixToOs('./data/techs/test.js'));
        });

    });

});
