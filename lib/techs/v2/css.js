'use strict';

var Template = require('../../template');

exports.API_VER = 2;

exports.techMixin = {

    getBuildResultChunk: function(relPath) {
        return '@import url(' + relPath + ');\n';
    },

    getCreateResult: function(path, suffix, vars) {

        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? ('_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal: '')): '');

        return Template.process([
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    }
};
