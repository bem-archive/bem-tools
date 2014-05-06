'use strict';

var SASS = require('node-sass');

exports.baseTechPath = require.resolve('./css-preprocessor.js');

exports.techMixin = {

    getBuildSuffixesMap: function() {
        return {
            'sass.css': ['sass', 'scss', 'css']
        };
    },

    getCreateSuffixes: function() {
        return ['sass'];
    },

    compileBuildResult: function(res, defer) {

        SASS.render({
            data: res,
            success: function(css) {
                return defer.resolve([css]);
            },
            error: function(err) {
                return defer.reject(err);
            }
        });

    }

};
