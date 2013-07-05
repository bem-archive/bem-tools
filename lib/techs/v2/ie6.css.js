'use strict';

var Q = require('q'),
    PATH = require('../../path');

exports.baseTechPath = PATH.join(__dirname, 'ie.css');

exports.techMixin = {

    getFirstBuildChunks: function(outputName) {
        var _this = this;
        return Q.all(['ie.css'].map(function(suffix) {
                return _this.getBuildResultChunk(_this.getPath(outputName, suffix));
            }))
            .then(function(res) {
                return res.join('');
            });
    }

};
