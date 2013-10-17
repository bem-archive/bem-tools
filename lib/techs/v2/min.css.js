'use strict';

require('./borschik');

exports.API_VER = 2;
exports.baseTechPath = require.resolve('./min');

exports.techMixin = {

    getSuffixes: function() {
        return ['css'];
    },

    getDependencies: function() {
        return ['css'];
    }
};
