var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level,
    Context = require('../../context').Context;

exports.OptParse = function() {
    return this
        .title('Блок.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
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
                var prefix = level.get('block', [name]);
                bemUtil.mkdir(myPath.dirname(prefix));
                context.getDefaultTechs().forEach(function(t) {
                    context.getTech(t).bemCreate(prefix, { BlockName: name });
                });
            });
        });
};
