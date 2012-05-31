var extend = require('bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': '',
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'html': '../../bem-bl/blocks-common/i-bem/bem/techs/html.js',
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
