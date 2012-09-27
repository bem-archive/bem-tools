var baseMixin = require('./js+coffee.js').techMixin;

exports.baseTechPath = require.resolve('./js-i.js');

exports.techMixin = {

    getBuildResult: baseMixin.getBuildResult,
    getSuffixes: baseMixin.getSuffixes,
    getBuildSuffixes: baseMixin.getBuildSuffixes

};
