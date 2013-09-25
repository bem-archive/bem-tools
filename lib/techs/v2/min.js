'use strict';

var Q = require('q'),
    B = require('borschik');

exports.API_VER = 2;

exports.techMixin = {

    create: function(prefix, vars, force) {
        return Q.all(this
            .getSuffixes()
            .map(function(suffix) {
                return B.api({
                            input: this.getPath(prefix, suffix),
                            output: this.getPath(prefix, this.getMinSuffix(suffix)),
                            tech: this.getMinTech(suffix),
                            minimize: (process.env.YENV || '').toLowerCase() === 'production'
                        });
            }, this));
    },

    /**
     * Returns suffix for minimized file by source suffix: css -> min.css, js -> min.js etc.
     * @param sourceSuffix suffix of source file.
     * @returns {string} Suffix for minimized file.
     */
    getMinSuffix: function(sourceSuffix) {
        return 'min.' + sourceSuffix;
    },

    /**
     * Returns source suffix by minimized suffix: min.css -> css, min.js -> js etc.
     * @param minSuffix suffix of minimized file.
     * @returns {string} Suffix for source file.
     */
    getSuffix: function(minSuffix) {
        return minSuffix.substr(4);
    },

    /**
     * Returns borschik tech name according to input sourceSuffix.
     * @param sourceSuffix suffix of the input file (css, js, etc).
     * @returns {string} Borschik tech name. When source suffix ends with css will return 'css'.
     * 'js' will be returned otherwise.
     */
    getMinTech: function(sourceSuffix) {
        return PATH.extname('dummy.' + sourceSuffix) === '.css'? 'css': 'js';
    },

    getCreateSuffixes: function() {
        return this.getSuffixes()
            .map(function(suffix) {
                return this.getMinSuffix(suffix);
            }, this);
    }
};
