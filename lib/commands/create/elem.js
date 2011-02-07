var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level,
    Context = require('../../context').Context;

exports.OptParse = function() {
    return this
        .title('Элемент блока.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('имя блока (обязательный параметр)')
            .required()
            .end()
        .arg()
            .name('names')
            .title('имена')
            .required()
            .push()
            .end()
        .act(function(opts, args) {
            var level = new Level(opts.levelDir),
                context = new Context(level, opts);

            args.names.forEach(function(name) {
                var prefix = level.get('elem', [opts.blockName, name]);
                bemUtil.mkdir(myPath.dirname(prefix));
                context.getDefaultTechs().forEach(function(t) {
                    context.getTech(t).bemCreate(prefix, {
                        BlockName: opts.blockName,
                        ElemName: name
                    });
                });
            });
        });
};
