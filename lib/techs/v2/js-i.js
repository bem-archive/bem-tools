'use strict';

exports.API_VER = 2;

exports.techMixin = {

    getBuildResultChunk: function(relPath) {
        return '/*borschik:include:' + relPath + '*/;\n';
    },

    getBuildSuffixesMap: function() {
        return {
            'js': ['js']
        };
    }

};
