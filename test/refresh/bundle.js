var assert = require('chai').assert,
    BEM = require('../..'),
    PATH = BEM.require('./path'),
    bemUtil = BEM.require('./util'),
    REFRESH = BEM.require('./refresh');


function absolute(path) {
    return PATH.resolve(__dirname, PATH.join('..', path));
}

describe('refresh', function() {

    describe('_Bundle()', function() {
        describe('.bundleRoot', function() {
            it("should be child directory of the Level", function() {
                var bundle = new REFRESH._Bundle(absolute('data/level1/first-block'));
                assert.equal(absolute('data/level1/first-block'), bundle.bundleRoot);
            });

            it("should be guessed from any resource inside the bundle", function() {
                var bundle = new REFRESH._Bundle(absolute('data/level1/first-block/__elem1/_mod2'));
                assert.equal(absolute('data/level1/first-block'), bundle.bundleRoot);
            });

            it("should be equal to the given filename when Level does not found", function() {
                var filename = absolute('data/');
                assert.equal(filename, bemUtil.findLevel(filename), 'given "filename" does not belongs any Level');

                var bundle = new REFRESH._Bundle(filename);
                assert.equal(filename, bundle.bundleRoot);
            });
        });

        describe('.isSource()', function() {
            var bundle = new REFRESH._Bundle(absolute('data/level1/first-block'));

            it("should return 'true' when the filename is the bunlde source", function() {
                assert.equal(true, bundle.isSource('data/level1/first-block/__elem1/_mod2/first-block__elem1_mod2.css'));
                assert.equal(true, bundle.isSource('data/level1/first-block/__elem1/_mod2/first-block__elem1_mod2_3.js'));
            });

            it("should return 'false' otherwise", function() {
                assert.equal(false, bundle.isSource('data/level1/first-block/'));
            });

        });

        describe('.getSourceRoots()', function() {
            var bundle = new REFRESH._Bundle(absolute('data/level1/first-block'));

            it("should contain the bundle own directory", function() {
                assert.include(bundle.getSourceRoots(), absolute('data/level1/first-block'));
            });

            // XXX: data/level1/ does not depends on any other build levels
            it("should contain the bundle build levels");
        });

        describe('.getTechSuffix', function() {
            var bundle = new REFRESH._Bundle(absolute('data/level1/first-block'));

            it('should handle single dot like index.css', function() {
                assert.equal('css', bundle._getTechSuffix('index.css'));
            });

            it('should handle multiple dots like index.bemjson.js', function() {
                assert.equal('bemjson.js', bundle._getTechSuffix('index.bemjson.js'));
            });

            it('should not consider dots in the directory names', function() {
                assert.equal('css', bundle._getTechSuffix('common.bundles/index/index.css'));
            });
        });


    });

});
