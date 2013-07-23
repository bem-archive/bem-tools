'use strict';

exports.techMixin = {

    getBuildResultChunk: function(relPath) {
        return 'include("' + relPath + '");\n';
    }

};
