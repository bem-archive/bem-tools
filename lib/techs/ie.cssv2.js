var Q = require('q'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./cssv2').Tech;

exports.Tech = INHERIT(Tech, {

    getTechName: function() {
        return 'ie.css';
    },

    getBuildSuffixesMap: function() {
        return {
            'ie.css': ['hover.css', 'css']
        };
    },

    getBuildResults: function(decl, levels, outputDir, outputName) {
        var _this = this,
            files = this.getBuildFilesFlat(decl, levels);

        return files.then(function(paths) {
            var getChunks = Q.all(paths.map(function(path) {
                    return _this.getBuildResultChunk(PATH.relative(outputDir, path.absPath));
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
