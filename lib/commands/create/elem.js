var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level,
    Context = require('../../context').Context;

exports.COA = function() {
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
        .arg()
            .name('names')
            .title('имена')
            .req()
            .arr()
            .end()
        .act(function(opts, args) {
            var level = new Level(opts.levelDir),
                context = new Context(level, opts);

            args.names.forEach(function(name) {
                var prefix = level.get('elem', [opts.blockName, name]);
                bemUtil.mkdirs(myPath.dirname(prefix));
                context.getDefaultTechs().forEach(function(t) {
                    context.getTech(t).bemCreate(prefix, {
                        BlockName: opts.blockName,
                        ElemName: name,
                        Prefix: prefix
                    });
                });
            });
        });
};
