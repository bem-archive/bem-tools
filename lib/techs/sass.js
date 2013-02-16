var INHERIT = require('inherit'),
    Template = require('../template'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import ' + relPath + '\n';
    },
    
    getCreateResult: function(path, suffix, vars) {

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '');

        return Template.process(['{{bemSelector}}'],
            vars);

    }

});
