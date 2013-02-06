var U = require('../util'),
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
     *     techs/
     *     level.js
     *
     * @param {String} path  Absolute path to the project directory
     * @param {Object} opts  Options to the `bem create` command
     * @return {Promise * Undefined}
     */
    createProject: function(path, opts) {

        var bemDir = PATH.join(path, '.bem'),
            levels = PATH.join(bemDir, 'levels'),

            // create .bem/levels/blocks.js level prototype
            blocks = this.createLevel({
                forceTech: ['examples'],
                outputDir: levels,
                force: opts.force
            }, ['blocks.js']),

            // create .bem/levels/bundles.js level prototype
            bundles = this.createLevel({
                outputDir: levels,
                force: opts.force
            }, ['bundles.js']),

            // create .bem/levels/examples.js level prototype
            examples = bundles.then(function() {
                return this.createLevel({
                    level: PATH.resolve(levels, 'bundles.js'),
                    outputDir: levels,
                    force: opts.force
                }, ['examples.js'])
            }.bind(this)),

            // create .bem/techs directory
            techs = U.mkdirp(PATH.join(bemDir, 'techs')),

            // run `npm link bem` command
            linkBem = U.exec('npm link bem', { cwd: path, env: process.env });

        return Q.all([blocks, bundles, examples, techs, linkBem])
            .then(function() {});

    }

};
