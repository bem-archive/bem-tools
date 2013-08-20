/* jshint quotmark: false */
'use strict';

var Q = require('q'),
    UTIL = require('util'),
    PATH = require('../../path'),
    Context = require('../../context').Context,
    U = require('../../util'),
    reqf = require('reqf');

module.exports = function() {

    return this
        .title('Level.').helpful()
        .apply(U.chdirOptParse)
        .apply(U.techsOptParse)
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('output directory, cwd by default')
            .def(process.cwd())
            .val(function (d) {
                return PATH.join(d, PATH.dirSep);
            })
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('base level to extend')
            .val(function(rel) {

                var abs = PATH.resolve(rel),
                    res, full;

                try {
                    // relative path to level dir?
                    res = PATH.resolve(abs, '.bem/level.js');
                    full = require.resolve(res);
                } catch (ignore) {
                    try {
                        // level name?
                        res = PATH.join('bem/lib/levels', rel);
                        full = require.resolve(res);
                    } catch (ignore) {
                        try {
                            // relative path to level config?
                            res = abs;
                            full = require.resolve(res);
                        } catch (ignore) {
                            try {
                                // require path to level config?
                                res = rel;
                                full = reqf(PATH.resolve('index.js')).resolve(rel);
                            } catch (ignore) {
                                return this.reject(UTIL.format('Base level "%s" not found', rel));
                            }
                        }
                    }
                }

                return {
                    res: res,
                    full: full
                };

            })
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force level creation (level configs will be overwritten)')
            .flag()
            .end()
        .arg()
            .name('names')
            .title('level names')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {

            var context = new Context(null, opts);

            return Q.all(args.names.map(function(name) {

                var path = PATH.resolve(opts.outputDir, name),
                    bemDir, levelFile;

                if (PATH.extname(name) === '.js') {
                    // Going to create level .js module
                    bemDir = PATH.dirname(path);
                    levelFile = path;
                } else {
                    // Going to create level dir
                    bemDir = PATH.join(path, '.bem');
                    levelFile = PATH.join(bemDir, 'level.js');
                }

                var techsContent = [],
                    content = [];

                // Protect level .js module from being accidentally overwritten
                if (!opts.force && PATH.existsSync(levelFile)) {
                    console.error('Skip "%s": already exists "%s"', name, levelFile);
                    console.error('Add --force to force creation.');
                    return;
                }

                var resPath;
                if (opts.level && opts.level.res) {
                    resPath = opts.level.res;
                    content.push('exports.baseLevelPath = require.resolve(\'' +
                        (PATH.isAbsolute(resPath)? PATH.relative(bemDir, resPath, true) : resPath) + '\');');
                }

                if (context.opts.forceTech) {
                    techsContent.push('techs = {');
                    context.opts.forceTech.reduce(function(c, t, i, arr) {
                        var tech = context.getTech(t);
                        c.push("    '" + tech.getTechName() + "': '" + tech.getTechRelativePath(bemDir) + "'" +
                            (i+1 < arr.length? ',' : ''));
                        return c;
                    }, techsContent);
                    techsContent.push('};');
                }

                (context.opts.addTech || context.opts.noTech) && techsContent.push('techs = techs || this.__base();');

                context.opts.addTech && context.opts.addTech.forEach(function(t) {
                    var tech = context.getTech(t);
                    techsContent.push("techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';");
                });

                context.opts.noTech && context.opts.noTech.forEach(function(t) {
                    techsContent.push("delete techs['" + (context.getTech(t)).getTechName() + "'];");
                });

                if (techsContent.length) {
                    techsContent.unshift('var techs;');
                    techsContent.push('return techs;');
                    techsContent = techsContent.map(function(c) {
                        return '    ' + c;
                    });
                    content.push('exports.getTechs = function() {', techsContent.join('\n'), '};');
                }

                content.push('');

                return U.mkdirp(bemDir)
                    .then(function() {
                        return U.writeFile(levelFile, content.join('\n'));
                    });

            }));

        });

};
