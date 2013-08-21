'use strict';

var Q = require('q'),
    PATH = require('../path'),
    LEVEL = require('../level'),
    createLevel = LEVEL.createLevel,
    Context = require('../context').Context,
    U = require('../util');

module.exports = function() {

    return this
        .title('Build tool.').helpful()
        .opt()
            .name('declaration').short('d').long('decl')
            .title('path to the file of declaration, required')
            .req()
            .end()
        .opt()
            .name('forceCache').title('Force level cache')
            .long('force-cache')
            .flag()
            .def(false)
            .val(function(force) {
                if (force) LEVEL.setCachePolicy(true);
            })
            .end()
        .opt()
            .name('root').short('r').long('root')
            .title('project root (cwd by default)')
            .def(process.cwd())
            .val(function(d) {
                return PATH.resolve(d);
            })
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('override level, can be used many times')
            .arr()
            .end()
        .opt()
            .name('tech').short('T').short('t').long('tech')
            .title('technologies to build, can be used many times')
            .arr()
            .end()
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('output directory, cwd by default')
            .def(process.cwd())
            .val(function (d) {
                return PATH.join(d, PATH.dirSep);
            })
            .end()
        .opt()
            .name('outputName').short('n').long('output-name')
            .title('output file prefix')
            .end()
        .opt()
            .name('outputLevel').short('L').long('output-level')
            .title('output level to store result into (this will override --output-dir and --output-name options)')
            .end()
        .opt()
            .name('block').short('b').long('block')
            .title('block name')
            .end()
        .opt()
            .name('elem').short('e').long('elem')
            .title('element name')
            .end()
        .opt()
            .name('mod').short('m').long('mod')
            .title('modifier name')
            .end()
        .opt()
            .name('val').short('v').long('val')
            .title('modifier value')
            .end()
        .opt()
            .name('force').title('Force build')
            .long('force')
            .flag()
            .end()
        .act(function(opts) {

            var levelOpts = {
                projectRoot: opts.root
            };

            if (opts.level) opts.level = opts.level.map(function(l) {
                if (typeof l === 'string') return createLevel(l, levelOpts);

                return l;
            });

            if (opts.outputLevel) {
                if (typeof opts.outputLevel === 'string') opts.outputLevel = createLevel(opts.outputLevel, levelOpts);

                if (opts.block) {
                    if (opts.outputName) return Q.reject('You must specify one of ' +
                        '--{block,elem,mod} or --output-name options');

                    opts.outputName = opts.outputLevel.getByObj(opts);
                } else {
                    if (opts.outputDir) {
                        opts.outputDir = PATH.resolve(opts.outputLevel.dir, opts.outputDir);
                    } else {
                        opts.outputName = PATH.resolve(opts.outputLevel.dir, opts.outputName);
                    }
                }
            }

            if (typeof opts.declaration === 'string') {
                opts.declarationPath = opts.declaration;
                opts.declaration = U.readDecl(PATH.absolute(opts.declaration));
            }

            var context = new Context(opts.outputLevel, opts);

            return Q.all(context.getTechs().map(function(techIdent) {

                return context.getTech(techIdent)
                    .buildByDecl(opts.declaration, context.getLevels(),
                        PATH.resolve(opts.outputDir, opts.outputName), opts);

            })).get(0);

        });

};
