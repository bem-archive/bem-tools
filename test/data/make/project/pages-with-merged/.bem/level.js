var extend = require(process.env.COVER? 'bem/lib-cov/util' : 'bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': '',
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'bemhtml': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'js': 'js-i.js'
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
