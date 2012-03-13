var INHERIT = require('inherit'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import "' + relPath.substring(0, relPath.length - (suffix.length + 1)) + '"\n';
    }

});