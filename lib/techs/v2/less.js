'use strict';

var LESS = require('less');

exports.baseTechPath = require.resolve('./css-preprocessor.js');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            'less.css': ['less', 'css']
        };
    },

    getCreateSuffixes: function() {
        return ['less'];
    },

    compileBuildResult: function(res, defer) {
        LESS.render(res, function(err, css) {
            if (err) return defer.reject(err);

            return defer.resolve([css]);
        });
    }

};
