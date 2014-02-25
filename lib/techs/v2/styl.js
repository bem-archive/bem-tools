'use strict';

var PATH = require('path'),
    STYLUS = require('stylus'),
    Template = require('../../template');

exports.baseTechPath = PATH.join(__dirname, 'css-preprocessor');

exports.techMixin = {

    getBuildResultChunk : function(relPath) {
        return '@import "' + relPath + '"\n';
    },

    getBuildSuffixesMap: function() {
        return {
            'css': ['styl', 'css']
        };
    },

    getCreateSuffixes: function() {
        return ['styl'];
    },

    getCreateResult: function(path, suffix, vars) {
        
        vars.Selector = '.' + vars.BlockName +
            (vars.ElemName? '__' + vars.ElemName : '') +
            (vars.ModName? ('_' + vars.ModName + (vars.ModVal? '_' + vars.ModVal: '')): '');

        return Template.process([
            '{{bemSelector}}'
            ],
            vars);
    },

    compileBuildResult: function(res, defer) {
        STYLUS.render(res, function(err, css) {
            if (err) return defer.reject(err);

            return defer.resolve([css]);
        });
    }

};
