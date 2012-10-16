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
     * Build `.js` files for bundles from `.coffee` and `.js` files
     * of blocks on `bem build`.
     *
     * @return {Object}
     */
    getBuildSuffixesMap: function() {
        return { 'js' : this.getSuffixes() };
    }

};
