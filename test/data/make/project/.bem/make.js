'use strict';
var BEM = require('bem'),
    PATH = require('path'),
    BEMBL_TECHS = PATH.resolve(__dirname, '../bem-bl/blocks-common/i-bem/bem/techs'),
    PATH = require('path');

module.exports = function(MAKE) {

    var levelManager = BEM.LevelManager.get();

    levelManager.setLevelClass('pages', BEM.defineLevel()
        .addTechs(
            'deps.js',
            'css',
            'ie.css',

            {
                'bemjson.js': '',
                'js': 'v2/js-i',
                'i18n': PATH.join(BEMBL_TECHS, 'v2/i18n.js'),
                'i18n.js': PATH.join(BEMBL_TECHS, 'v2/i18n.js.js'),
                'bemhtml': PATH.join(BEMBL_TECHS, 'v2/bemhtml.js'),
                'html': PATH.join(BEMBL_TECHS, 'html.js')

            }
        )
        .setConfig({
            bundleBuildLevels: [
                PATH.resolve(__dirname, '../bem-bl/blocks-common'),
                PATH.resolve(__dirname, '../bem-bl/blocks-desktop'),
                PATH.resolve(__dirname, '../blocks')
            ]
        })
        .createClass());

    levelManager.setLevelClass('pages-with-merged', BEM.defineLevel()
        .addTechs(
            'bemdecl.js',
            'deps.js',
            {'bemjson.js': ''}
        )
        .setConfig({
            bundleBuildLevels: [
                PATH.resolve(__dirname, '../bem-bl/blocks-common'),
                PATH.resolve(__dirname, '../bem-bl/blocks-desktop'),
                PATH.resolve(__dirname, '../blocks')
            ]
        })
        .createClass());


    MAKE.decl('Arch', {

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
    MAKE.decl('BundleNode', {

        getTechs: function() {

            var arr = this.__base();

            // remove js tech
            arr.splice(arr.indexOf('js'), 1);

            // add i18n techs
            return arr.concat(['i18n', 'i18n.js']);

        },

        'create-i18n.js-optimizer-node': function(tech, sourceNode, bundleNode) {

            sourceNode.getFiles().forEach(function(f) {
                this['create-js-optimizer-node'](tech, this.ctx.arch.getNode(f), bundleNode);
            }, this);

        }

    });


    // Build merged bundle
    MAKE.decl('BundleNode', {

        getTechs: function() {

            if (this.getLevelPath() === 'pages-with-merged') return [
                'bemdecl.js',
                'deps.js'
            ];

            return this.__base();

        }

    });


    MAKE.decl('BundlesLevelNode', {

        buildMergedBundle: function() {
            return this.getLevelPath() === 'pages-with-merged';
        }

    });
};
