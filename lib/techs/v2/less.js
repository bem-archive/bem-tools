'use strict';

var PATH = require('path'),
    LESS = require('less');

exports.baseTechPath = PATH.join(__dirname, 'css-preprocessor');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            css: ['less', 'css']
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
