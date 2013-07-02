'use strict';

var FS = require('fs');

exports.API_VER = 2;

exports.techMixin = {

    getBuildResultChunk: function(relPath, path) {

        return [
            '/* ' + relPath + ': begin */ /**/',
            FS.readFileSync(path) + ';',
            '/* ' + relPath + ': end */ /**/',
            '\n'].join('\n');

    }
};
