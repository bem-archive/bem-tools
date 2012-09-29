var COFFEE = require('coffee-script'),
    PATH = require('../path'),
    Q = require('q');

exports.baseTechPath = require.resolve('./js.js');

exports.techMixin = {

    readContent: function(path, suffix) {

        return this.__base.apply(this, arguments)
            .then(function(content) {

                return suffix === 'coffee'?
                    COFFEE.compile(content, { filename: path }) :
                    content;

            });

    },

    getBuildResult: function(prefixes, suffix, outputDir, outputName) {

        var _this = this;

        return Q.when(this.filterPrefixes(prefixes, this.getSuffixes()))
            .then(function(paths) {

                return Q.all(paths.map(function(path) {

                    return _this.getBuildResultChunk(
                        PATH.relative(outputDir, path),
                        path,
                        suffix);

                }));

            });

    },

    /**
     * Collect `.coffee` and `.js` files from blocks on `bem build`.
     *
     * @return {Array}
     */
    getSuffixes: function() {
        return ['js', 'coffee'];
    },

    /**
     * Create only `.coffee` files for blocks on `bem create`.
     *
     * @return {Array}
     */
    getCreateSuffixes: function() {
        return ['coffee'];
    },

    /**
     * Build `.js` files for bundles on `bem build`.
     *
     * @return {Array}
     */
    getBuildSuffixes: function() {
        return ['js'];
    }

};
