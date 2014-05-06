'use strict';

var ROOLE = require('roole');

exports.baseTechPath = require.resolve('./css-preprocessor.js');

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
            if(err) {
                var e = new Error(err);
                if(typeof err.context === 'function') {
                    e.message += '\n' + err.context();
                }
                defer.reject(e);
                return;
            }

            defer.resolve([res]);
        });
    }

};
