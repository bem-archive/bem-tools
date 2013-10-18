'use strict';
var PATH = require('path'),
    BEMBL_TECHS = PATH.resolve(__dirname, '../bem-bl/blocks-common/i-bem/bem/techs');

process.env.BEM_I18N_LANGS = 'ru en';

module.exports = function(make) {

    make.levels(function(levels) {
        levels
            .addLevel('pages')
                .addTechs(
                    'deps.js',
                    'css',
                    'ie.css',

                    {
                        'bemjson.js': '',
                        'js': 'v2/js-i',
                        'min.ie.css': {
                            baseTechPath: 'v2/min',
                            getSuffixes: function() {
                                return ['ie.css'];
                            },

                            getDependencies: function() {
                                return ['css']
                            }
                        },
                        'i18n': PATH.join(BEMBL_TECHS, 'v2/i18n.js'),
                        'i18n.js': PATH.join(BEMBL_TECHS, 'v2/i18n.js.js'),
                        'min.i18n.js': {
                            baseTechPath: 'v2/min',
                            getSuffixes: function() {
                                return process.env.BEM_I18N_LANGS.split(' ')
                                    .map(function(lang) {
                                        return lang + '.js';
                                    })
                                    .concat('js');
                            },

                            getDependencies: function() {
                                return ['i18n.js'];
                            }
                        },
                        'bemhtml': PATH.join(BEMBL_TECHS, 'v2/bemhtml.js'),
                        'html': PATH.join(BEMBL_TECHS, 'html.js')

                    }
                )
                .setBundleBuildLevels(
                    PATH.resolve(__dirname, '../bem-bl/blocks-common'),
                    PATH.resolve(__dirname, '../bem-bl/blocks-desktop'),
                    PATH.resolve(__dirname, '../blocks')
                )
            .addLevel('pages-with-merged')
                .addTechs(
                    'bemdecl.js',
                    'deps.js',
                    {
                        'bemjson.js': ''
                    }
                )
                .setBundleBuildLevels(
                    PATH.resolve(__dirname, '../bem-bl/blocks-common'),
                    PATH.resolve(__dirname, '../bem-bl/blocks-desktop'),
                    PATH.resolve(__dirname, '../blocks')
                );
    });

    make.nodes(function(registry) {
        registry.decl('Arch', {

            getLevelCachePolicy: function() {
                return {
                    cache: false,
                    except: [
                        'bem-bl/blocks-common',
                        'bem-bl/blocks-desktop'
                    ]
                };
            }

        });

        // Build i18n files
        registry.decl('BundleNode', {

            getTechs: function() {

                var arr = this.__base();

                // remove js tech
                arr.splice(arr.indexOf('js'), 1);

                // add i18n techs
                return arr.concat(['i18n', 'i18n.js', 'min.ie.css', 'min.i18n.js']);

            },


            'create-min.ie.css-node': function(tech, bundleNode, magicNode) {

                return this.setBemCreateNode(
                    tech,
                    bundleNode,
                    magicNode);
            },

            'create-min.i18n.js-node': function(tech, bundleNode, magicNode) {

                return this.setBemCreateNode(
                    tech,
                    bundleNode,
                    magicNode);
            }

        });

        // Build merged bundle
        registry.decl('BundleNode', {

            getTechs: function() {

                if (this.getLevelPath() === 'pages-with-merged') return [
                    'bemdecl.js',
                    'deps.js'
                ];

                return this.__base();

            }

        });

        registry.decl('BundlesLevelNode', {

            buildMergedBundle: function() {
                return this.getLevelPath() === 'pages-with-merged';
            }

        });
    });
};
