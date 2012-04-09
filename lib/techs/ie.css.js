var Q = require('qq'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./css').Tech;

exports.Tech = INHERIT(Tech, {

    getSuffixes: function() {
        var n = this.getTechName();
        return ['hover.' + n, n];
    },

    getBuildResults: function(prefixes, outputDir, outputName) {
        var _this = this;
        return Q.when(this.filterPrefixes(prefixes, this.getSuffixes()), function(paths) {
            var getChunks = Q.shallow(paths.map(function(path) {
                    return _this.getBuildResultChunk(PATH.relative(outputDir, path));
                })),
                getFirst = Q.when(_this.getBuildResultChunk(_this.getPath(outputName, 'css')));

            return Q.all([getFirst, getChunks]).spread(function(first, res) {
                res.unshift(first);
                return res;
            });
        });
    },

    storeBuildResults: function(prefix, res) {
        return this.storeBuildResult(this.getPath(prefix), this.getTechName(), res);
    }
});
