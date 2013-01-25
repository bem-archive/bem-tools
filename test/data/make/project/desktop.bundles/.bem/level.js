var BEM = require('../../..'),
    PATH = require('path'),
    extend = BEM.util.extend,

    BEM_TECHS = '../../bem-bl/blocks-common/i-bem/bem/techs';

exports.getTechs = function() {

    return {
        'bemjson.js': '',
        'deps.js': 'v2/deps.js',
        'js': 'v2/js-i',
        'css': 'v2/css',
        'ie.css': 'v2/ie.css',
        'i18n': PATH.join(BEM_TECHS, 'v2/i18n.js'),
        'i18n.js': PATH.join(BEM_TECHS, 'v2/i18n.js.js'),
        'bemhtml': PATH.join(BEM_TECHS, 'v2/bemhtml.js'),
        'html': PATH.join(BEM_TECHS, 'html.js')
    };
};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../desktop.blocks'
        ])

    });

};
