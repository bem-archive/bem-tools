'use strict';

var U = require('../../util'),
    Q = require('q'),
    PATH = require('path');

exports.baseTechPath = require.resolve('./level.js');

exports.techMixin = {

    createByDecl: function(item, level, opts) {

        var _this = this,
            projectName = item.block;

        return this.createLevel({
                outputDir: level.dir,
                force: opts.force,
                level: 'project'
            }, [projectName])
            .then(function() {
                return _this.createProject(PATH.join(level.dir, projectName), opts);
            });

    },

    /**
     * Create the following project structure
     *
     * .bem/
     *     levels/
     *         blocks.js
     *         bundles.js
     *         docs.js
     *         examplex.js
     *         tech-docs.js
     *     techs/
     *     level.js
     * node_modules/
     *
     * @param {String} path  Absolute path to the project directory
     * @param {Object} opts  Options to the `bem create` command
     * @return {Promise * Undefined}
     */
    createProject: function(path, opts) {

        var bemDir = PATH.join(path, '.bem'),
            levels = PATH.join(bemDir, 'levels'),

            // .bem/levels/create blocks.js level prototype
            blocks = this.createLevel({
                forceTech: ['examples', 'tech-docs'],
                outputDir: levels,
                force: opts.force
            }, ['blocks.js']),

            // create .bem/levels/bundles.js level prototype
            bundles = this.createLevel({
                forceTech: ['bemjson.js', 'blocks'],
                outputDir: levels,
                force: opts.force
            }, ['bundles.js']),

            // create .bem/levels/examples.js level prototype
            examples = bundles.then(function() {
                return this.createLevel({
                    level: PATH.resolve(levels, 'bundles.js'),
                    outputDir: levels,
                    force: opts.force
                }, ['examples.js']);
            }.bind(this)),

            // create .bem/levels/docs.js level prototype
            docs = this.createLevel({
                forceTech: ['md'],
                outputDir: levels,
                force: opts.force
            }, ['docs.js']),

            // create .bem/levels/tech-docs.js level prototype
            techDocs = this.createLevel({
                forceTech: ['docs', 'md'],
                outputDir: levels,
                force: opts.force,
                level: 'simple'
            }, ['tech-docs.js']),

            // create .bem/techs and node_modules/ directories
            dirs = Q.all([
                U.mkdirp(PATH.join(bemDir, 'techs')),
                U.mkdirp(PATH.join(path, 'node_modules'))
            ]),

            // run `npm link bem` command
            linkBem = U.exec('npm link bem', { cwd: path, env: process.env });

        return Q.all([blocks, bundles, examples, docs, techDocs, dirs, linkBem])
            .then(function() {});

    }

};
