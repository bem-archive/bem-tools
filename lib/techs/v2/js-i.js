var INHERIT = require('inherit'),
    Tech = require('../..').TechV2;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '/*borschik:include:' + relPath + '*/;\n';
    },

    getBuildSuffixesMap: function() {
        return {
            'js': ['js']
        }
    }

});
