var PATH = require('../../path'),
    bemUtil = require('../../util'),
    createLevel = require('../../level').createLevel,
    Context = require('../../context').Context;

module.exports = function() {

    return this
        .title('Модификатор.').helpful()
        .apply(bemUtil.chdirOptParse)
        .apply(bemUtil.techsOptParse)
        .apply(bemUtil.levelOptParse)
        .opt()
            .name('blockName').short('b').long('block')
            .title('имя блока (обязательный параметр)')
            .req()
            .end()
        .opt()
            .name('elemName').short('e').long('elem')
            .title('имя элемента')
            .end()
        .opt()
            .name('modVal').short('v').long('val')
            .title('значения модификатора')
            .arr()
            .end()
        .opt()
            .name('force').short('f').long('force')
            .title('принудительно создавать файлы модификатора')
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
                context = new Context(level, opts);

            args.names.forEach(function(name) {
                var item = opts.elemName ? 'elem' : 'block',
                    args = (opts.elemName ? [opts.blockName, opts.elemName] : [opts.blockName])
                        .concat(name),
                    vars = {
                        BlockName: opts.blockName,
                        ElemName: opts.elemName,
                        ModName: name,
                        Prefix: prefix
                    },
                    techs = context.getDefaultTechs();

                if(opts.modVal) {
                    opts.modVal.forEach(function(val) {
                        var prefix = level.get(item + '-mod-val', args.concat(val));
                        bemUtil.mkdirs(PATH.dirname(prefix));
                        vars.ModVal = val;
                        techs.forEach(function(t) {
                            context.getTech(t).create(prefix, vars, opts.force);
                        });
                        delete vars.ModVal;
                    });
                } else {
                    var prefix = level.get(item + '-mod', args);
                    bemUtil.mkdirs(PATH.dirname(prefix));
                    techs.forEach(function(t) {
                        context.getTech(t).create(prefix, vars, opts.force);
                    });
                }
            });
        });

};
