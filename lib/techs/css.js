var INHERIT = require('inherit'),
    Template = require('../template'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    techModule: module,

    getTechPath: function() {
        return 'bem/lib/techs/css';
    },

    getBuildResultForPrefix: function(relPath, path, suffix) {
        return '@import url(' + relPath + ');\n';
    },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '');

        return Template.process([
            '{{bemSelector}}',
            '{',
            '    /* ... */',
            '}'],
            vars);

    }

});
