var INHERIT = require('inherit'),
    Q = require('qq'),
    PATH = require('../path'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    /** 
     * Creates .less suffix since this tech is superset for css as well
     */
    getCreateSuffixes: function() {
        return ['less'];
    },

    getBuildResults: function(prefixes, outputDir, outputName) {
        var res = {},
            suffixes = ['less', 'css'],
            techname = this.getTechName();

        res[techname] = this.getBuildResult(prefixes, suffixes, outputDir, outputName);

        return Q.shallow(res);
    },
    
    getBuildResult: function(prefixes, suffixes, outputDir, outputName) {
        var _this = this, techsuffix = this.getTechName();

        return Q.when(this.filterPrefixes(prefixes, suffixes), function(paths) {
            return Q.all(paths.map(function(path) {
                return _this.getBuildResultChunk(
                    PATH.relative(outputDir, path), path, techsuffix);
            }));
        });
    }

});
