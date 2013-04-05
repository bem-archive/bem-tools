var INHERIT = require('inherit'),
    Template = require('../template'),
    Tech = require('../tech').TechV2;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import url(' + relPath + ');\n';
    },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '');

        return Template.process([
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    },

    getBuildSuffixesMap: function() {
        return {
            'css': ['css']
        }
    },

    getTechName: function() {
        return 'css';
    }
});
