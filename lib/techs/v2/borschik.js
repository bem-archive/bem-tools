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

    getMinSuffix: function(sourceSuffix) {
        return 'min.' + sourceSuffix;
    },

    getMinTech: function(sourceSuffix) {
        if (('.' + sourceSuffix).match(/\.css$/)) return 'css';

        return 'js';
    },

    getCreateSuffixes: function() {
        return this.getSuffixes()
            .map(function(suffix) {
                return this.getMinSuffix(suffix);
            }, this);
    }
};
