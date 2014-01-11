'use strict';

var PATH = require('path'),
    ROOLE = require('roole');

exports.baseTechPath = PATH.join(__dirname, 'css-preprocessor');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            'roole.css' : ['roo', 'css']
        };
    },

    getCreateSuffixes: function() {
        return ['roo'];
    },

    compileBuildResult: function(res, defer) {
        ROOLE.compile(res, {
            filename : './',
            out : './',
            indent : ' ',
            prefixes : []
        }, function(err, res) {
            err?
                defer.reject(err) :
                defer.resolve([res]);
        });
    }

};
