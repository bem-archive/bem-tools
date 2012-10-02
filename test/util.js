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

        it("'custom' resolves to 'bem/lib/tech'", function() {
            assert.equal(U.getBemTechPath('custom'), PATH.unixToOs(bemLib + 'tech.js'));
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

    describe('readJsonJs()', function() {

        var example = {
                block: 'b-page',
                title: 'Pseudo link',
                head: [
                    { elem: 'css', url: '_example.css'},
                    { elem: 'css', url: '_example', ie: true },
                    { block: 'i-jquery', elem: 'core' },
                    { elem: 'js', url: '_example.js' }
                ],
                content: [
                    {
                        block: 'b-link',
                        mods : { pseudo : 'yes', togcolor : 'yes', color: 'green' },
                        url: '#',
                        target: '_blank',
                        title: 'Click me',
                        content : 'This pseudo link changes its color after click'
                    }
                ]
            };
         
       function testRead(file, reference) {
           var path = PATH.resolve(__dirname, 'data/util/' + file + '.bemjson.js');

           return (function(done) {
               this.timeout(0);

               U.readJsonJs(path).then(function(json) {
                   assert.deepEqual(json, reference);
                   done();
               })
               .fail(done)
               .end();
           });
        };

        it("simple", testRead('simple', example));

        it("include in array", testRead('include-in-array', example));

        it("include in object", testRead('include-in-object', example));

    });

});
