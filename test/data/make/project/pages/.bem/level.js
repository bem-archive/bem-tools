var extend = require('bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': ''
    };
};

exports.getConfig = function() {
    return extend({}, this.__base() || {}, {
        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])
    });
};
