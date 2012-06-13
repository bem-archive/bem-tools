var UTIL = require('util'),
    PATH = require('../../path'),
    Tech = require('../../tech').Tech,
    Context = require('../../context').Context,
    bemUtil = require('../../util');

module.exports = function() {

    return this
        .title('Level.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .opt()
            .name('outputDir').short('o').long('output-dir')
            .title('output directory, cwd by default')
            .val(function (d) {
                return PATH.join(d, PATH.dirSep);
            })
            .end()
        .opt()
            .name('level').short('l').long('level')
            .title('base level to extend')
            .val(function(l) {
                return { rel: l, abs: PATH.resolve(l) };
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

            // FIXME: унести на уровень выше, например в обработку опций
            Tech.setContext(context);

            args.names.forEach(function(name) {
                var dir = PATH.resolve(opts.outputDir, name);
                if (!opts.force && bemUtil.isDirectory(dir)) {
                    UTIL.error(['Skip "' + name + '": already exists "' + dir + '"',
                        'Add --force to force creation.'].join('\n'));
                    return;
                }

                // TODO: move to .val() of 'level' option
                var proto, protoPath, protoFullPath;
                if (opts.level) {
                    try {
                        protoFullPath = require.resolve(protoPath = PATH.resolve(opts.level.abs, '.bem/level.js'));
                    } catch (ignore) {
                        try {
                            protoFullPath = require.resolve(protoPath = PATH.join('bem/lib/levels', opts.level.rel));
                        } catch (ignore) {
                            try {
                                protoFullPath = require.resolve(protoPath = opts.level.abs);
                            } catch (ignore) {
                                UTIL.error(['Skip "' + name + '": base level "',
                                    opts.level, '" not found'].join(''));
                                return;
                            }
                        }
                    }
                    protoFullPath && (proto = require(protoFullPath));
                }

                var bemDir = PATH.join(dir, '.bem'),
                    levelFile = PATH.join(bemDir, 'level.js'),
                    techsContent = [],
                    content = [];

                bemUtil.mkdirs(bemDir);

                proto && content.push('exports.baseLevelPath = require.resolve(\'' +
                        (PATH.isAbsolute(protoPath)? PATH.relative(levelFile, protoPath) : protoPath) + '\');');

                if(context.opts.forceTech) {
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
                    techsContent.push("techs['" + tech.getTechName() + "'] = '" + tech.getTechRelativePath(bemDir) + "';") });

                context.opts.noTech && context.opts.noTech.forEach(function(t) {
                    techsContent.push("delete techs['" + (context.getTech(t)).getTechName() + "'];") });

                if(techsContent.length) {
                    techsContent.unshift('var techs;');
                    techsContent.push('return techs;');
                    techsContent = techsContent.map(function(c) {
                        return '    ' + c;
                    });
                    content.push('exports.getTechs = function() {', techsContent.join('\n'), '};');
                }

                bemUtil.write(levelFile, content.join('\n'));
            });
        });

};
