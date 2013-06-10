var extend = require(process.env.COVER? 'bem/lib-cov/util' : 'bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': '',
        'bemdecl.js': 'v2/bemdecl.js',
        'deps.js': 'v2/deps.js'
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
