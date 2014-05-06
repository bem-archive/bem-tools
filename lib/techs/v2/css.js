'use strict';

var Template = require('../../template');

exports.API_VER = 2;

exports.techMixin = {

    template: ['{{bemSelector}}', '{', '}'],

    getBuildResultChunk: function(relPath) {
        return '@import url(' + relPath + ');\n';
    },

    getSelector: function(vars) {

        return '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? ('_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal: '')): '');

    },

    applyTemplate: function(vars) {
        vars.Selector = this.getSelector(vars);
        return vars.opts && vars.opts.content ? vars.opts.content: Template.process(this.template, vars);
    },

    getCreateResult: function(path, suffix, vars) {
        return this.applyTemplate(vars);
    }

};
