'use strict';

var INHERIT = require('inherit'),
    Template = require('../template'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import url(' + relPath + ');\n';
    },

    getCreateResult: function(path, suffix, vars) {

        if (vars.opts && vars.opts.content) return vars.opts.content;

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? ('_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal: '')): '');

        return Template.process([
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    }
});
