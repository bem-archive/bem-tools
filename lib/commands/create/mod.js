var Q = require('qq'),
    PATH = require('../../path'),
    bemUtil = require('../../util'),
    createLevel = require('../../level').createLevel,
    Context = require('../../context').Context,
    Tech = require('../../tech').Tech;

module.exports = function() {

    return this
        .title('Modifier.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('block name, required')
            .req()
            .end()
        .opt()
            .name('elemName').short('e').long('elem')
            .title('element name')
            .end()
        .opt()
            .name('modVal').short('v').long('val')
            .title('modifier value')
            .arr()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('force files creation')
            .flag()
            .end()
        .arg()
            .name('names')
            .title('modifier names')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {
            var level = createLevel(opts.levelDir),
                context = new Context(level, opts),
                done;

            // FIXME: унести на уровень выше, например в обработку опций
            Tech.setContext(context);

            args.names.forEach(function(name) {
                var item = opts.elemName ? 'elem' : 'block',
                    args = (opts.elemName ? [opts.blockName, opts.elemName] : [opts.blockName])
                        .concat(name),
                    vars = {
                        args: args.raw || [],
                        BlockName: opts.blockName,
                        ElemName: opts.elemName,
                        ModName: name
                    },
                    techs = context.getDefaultTechs();

                if(opts.modVal) {
                    opts.modVal.forEach(function(val) {
                        var prefix = level.get(item + '-mod-val', args.concat(val)),
                            createVars = bemUtil.extend({}, vars, { Prefix: prefix, ModVal: val });
                        bemUtil.mkdirs(PATH.dirname(prefix));
                        techs.forEach(function(t) {
                            done = Q.wait(context.getTech(t).create(prefix, createVars, opts.force));
                        });
                    });
                } else {
                    var prefix = level.get(item + '-mod', args),
                        createVars = bemUtil.extend({}, vars, { Prefix: prefix });
                    bemUtil.mkdirs(PATH.dirname(prefix));
                    techs.forEach(function(t) {
                        done = Q.wait(done, context.getTech(t).create(prefix, createVars, opts.force));
                    });
                }
            });

            return done;
        });

};
