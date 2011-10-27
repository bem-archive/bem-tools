var PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./css').Tech;

exports.Tech = INHERIT(Tech, {

    getSuffixes: function() {
        var n = this.getTechName();
        return ['hover.' + n, n];
    },

    getBuildResults: function(prefixes, outputDir, outputName) {
        var _this = this,
            res = this
            .filterPrefixes(prefixes, this.getSuffixes())
            .map(function(path) {
                return _this.getBuildResultForPrefix(PATH.relative(outputDir, path));
            });

        res.unshift(this.getBuildResultForPrefix(this.getPath(outputName, 'css')));

        return res;
    },

    storeBuildResults: function(prefix, res) {
        this.storeBuildResult(this.getPath(prefix), this.getTechName(), res);
    }

});
