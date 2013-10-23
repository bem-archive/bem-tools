'use strict';

var PATH = require('path'),
    B = require('borschik'),
    MemoryStream = require('memorystream');

exports.API_VER = 2;

exports.techMixin = {

    getCreateResult: function(path, suffix, vars) {

        var s = new MemoryStream(''),
            data = '';

        s.on('data', function(d) {
            data += d;
        });

        return B.api({
                input: this.getPath(vars.Prefix, this.getSuffix(suffix)),
                output: s,
                tech: this.getMinTech(suffix),
                minimize: (process.env.YENV || '').toLowerCase() === 'production'
            })
            .then(function() {
                return data;
            });
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

    /**
     * Suffixes for the files which will be created.
     * @returns {Array} An array of suffixes. For each suffix in getSuffixes() result there will be a minimized suffix in this array.
     */
    getCreateSuffixes: function() {
        return this.getSuffixes().map(this.getMinSuffix, this);
    },

    storeCreateResult: function(path, suffix, res, force) {
        // always overwrite generated files
        return this.__base(path, suffix, res, true);
    },

    preferFork: function() {
        return true;
    },

    getDefaultMakeCommand: function() {
        return 'create';
    }
};
