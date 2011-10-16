var FS = require('fs'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    techModule: module,

    getTechPath: function() {
        return 'bem/lib/techs/js';
    },

    getBuildResultForPrefix: function(relPath, path, suffix) {

        return [
            '/* ' + relPath + ': begin */ /**/',
            FS.readFileSync(path),
            '/* ' + relPath + ': end */ /**/',
            '\n'].join('\n');

    }

});
