var Q = require('qq'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./ie.css').Tech;

exports.Tech = INHERIT(Tech, {
    getBuildResults: function(prefixes, outputDir, outputName) {
        var _this = this;
        return Q.when(this.filterPrefixes(prefixes, this.getSuffixes()), function(paths) {
            var getChunks = Q.shallow(paths.map(function(path) {
                    return _this.getBuildResultChunk(PATH.relative(outputDir, path));
                })),
                getFirst = Q.when(_this.getBuildResultChunk(_this.getPath(outputName, 'css')) +
                		  _this.getBuildResultChunk(_this.getPath(outputName, 'ie.css')));

            return Q.join(getFirst, getChunks, function(first, res) {
                res.unshift(first);
                return res;
            });
        });
    }
});
