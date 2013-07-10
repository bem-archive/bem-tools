'use strict';

var Q = require('q'),
    PATH = require('../path'),
    INHERIT = require('inherit'),
    Tech = require('./ie.css').Tech;

exports.Tech = INHERIT(Tech, {

    getFirstBuildChunks: function(outputName) {
        var _this = this;
        return Q.all(['ie.css'].map(function(suffix) {
                return _this.getBuildResultChunk(_this.getPath(outputName, suffix));
            }))
            .then(function(res) {
                return res.join('');
            });
    }

});
