var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level,
    Context = require('../../context').Context,
    Tech = require('../../tech').Tech;

exports.COA = function() {
    return this
        .title('Блок.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .arg()
            .name('names')
            .title('имена')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {
            var level = new Level(opts.levelDir),
                context = new Context(level, opts);

            // FIXME: унести на уровень выше, например в обработку опций
            Tech.setContext(context);

            args.names.forEach(function(name) {
                var prefix = level.get('block', [name]);
                bemUtil.mkdirs(myPath.dirname(prefix));
                context.getDefaultTechs().forEach(function(t) {
                    context.getTech(t).bemCreate(prefix, { BlockName: name, Prefix: prefix });
                });
            });
        });
};
