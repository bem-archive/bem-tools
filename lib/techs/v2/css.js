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
            (vars.ModVal? '_' + vars.ModName + '_' + vars.ModVal : '');

        return Template.process([
            '{{bemSelector}}',
            '{',
            '}'],
            vars);

    }
};
