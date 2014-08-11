'use strict';

var STYLUS = require('stylus');

exports.baseTechPath = require.resolve('./css-preprocessor.js');

exports.techMixin = {

    template: ['{{bemSelector}}'],

    getBuildSuffixesMap: function() {
        return {
            'styl.css': ['styl', 'css']
        };
    },

    getCreateSuffixes: function() {
        return ['styl'];
    },

    compileBuildResult: function(res, defer) {
        STYLUS.render(res, function(err, css) {
            if (err) return defer.reject(err);

            return defer.resolve([css]);
        });
    }

};
