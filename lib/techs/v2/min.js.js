'use strict';

exports.API_VER = 2;
exports.baseTechPath = require.resolve('./min');

exports.techMixin = {

    getSuffixes: function() {
        return ['js'];
    },

    getDependencies: function() {
        return ['js'];
    }
};
