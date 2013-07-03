'use strict';

var Q = require('q'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./css').Tech;

exports.Tech = INHERIT(Tech, {

    getSuffixes: function() {
        var n = this.getTechName();
        return ['hover.' + n, n];
    },

    getBuildSuffixes: function() {
        return [this.getTechName()];
    },

    getBuildResults: function(prefixes, outputDir, outputName) {
        var _this = this;
        return Q.when(this.filterPrefixes(prefixes, this.getSuffixes()), function(paths) {
            var getChunks = Q.all(paths.map(function(path) {
                    return _this.getBuildResultChunk(PATH.relative(outputDir, path), path);
                })),
                getFirst = _this.getFirstBuildChunks(outputName);

            return Q.all([getFirst, getChunks]).spread(function(first, res) {
                res.unshift(first);
                return res;
            });
        });
    },

    getFirstBuildChunks: function(outputName) {
        return this.getBuildResultChunk(this.getPath(outputName, 'css'));
    },

    storeBuildResults: function(prefix, res) {
        return this.storeBuildResult(this.getPath(prefix), this.getTechName(), res);
    }
});
