'use strict';

var PATH = require('path'),
    SASS = require('node-sass');

exports.baseTechPath = PATH.join(__dirname, 'css-preprocessor');

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
