'use strict';

var FS = require('fs'),
    INHERIT = require('inherit'),
    Tech = require('../tech').Tech;

exports.Tech = INHERIT(Tech, {

    getBuildResultChunk: function(relPath, path, suffix) {

        return [
            '/* ' + relPath + ': begin */ /**/',
            FS.readFileSync(path) + ';',
            '/* ' + relPath + ': end */ /**/',
            '\n'].join('\n');

    }
});
