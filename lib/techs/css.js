'use strict';

var INHERIT = require('inherit'),
    Template = require('../template'),
    Deps = require('./deps.js').Deps,
    Tech = require("../tech").Tech;


exports.Tech = INHERIT(Tech, {

    transformBuildDecl: function(decl) {
        return decl
            .then(function(decl){
                var deps = new Deps().parseDepsDecl(decl)
                    .filter(function(dependson, dependent) {
                        return dependson.item.tech === 'css' || !dependson.item.tech;
                    }).map(function(item){
                        return item.item;
                    });
                return {deps: deps};
            });
    },

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

    }
});
