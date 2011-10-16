var INHERIT = require('inherit'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    techModule: module,

    getTechPath: function() {
        return 'bem/lib/techs/sass';
    },

    getBuildResultForPrefix: function(relPath, path, suffix) {
        return '@import ' + relPath + '\n';
    }

});
