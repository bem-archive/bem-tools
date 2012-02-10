var Q = require('qq'),
    PATH = require('../../path'),
    bemUtil = require('../../util'),
    createLevel = require('../../level').createLevel,
    Context = require('../../context').Context,
    Tech = require('../../tech').Tech;

module.exports = function() {

    return this
        .title('Элемент блока.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('имя блока (обязательный параметр)')
            .req()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('принудительно создавать файлы элемента')
            .flag()
            .end()
        .arg()
            .name('names')
            .title('имена')
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
                var prefix = level.get('elem', [opts.blockName, name]);
                bemUtil.mkdirs(PATH.dirname(prefix));
                context.getDefaultTechs().forEach(function(t) {
                    done = Q.wait(done, context.getTech(t).create(prefix, {
                        BlockName: opts.blockName,
                        ElemName: name,
                        Prefix: prefix
                    }, opts.force));
                });
            });

            return done;
        });

};
