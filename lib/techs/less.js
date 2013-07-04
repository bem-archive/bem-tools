'use strict';

var INHERIT = require('inherit'),
    CssTech = require('./css').Tech;

exports.Tech = INHERIT(CssTech, {

    getBuildResultChunk: function(relPath, path, suffix) {
        return '@import url("' + relPath + '");\n';
    }

});
