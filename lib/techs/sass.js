var INHERIT = require('inherit'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    getBuildResultForPrefix: function(relPath, path, suffix) {
        return '@import ' + relPath + '\n';
    }

});
