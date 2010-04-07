var bem_util = require('../../util'),
    Level = require('../../level').Level,
    parser = exports.parser = bem_util.bem_create_bem_parser()
        .help('модификатор');

parser.option('-b', '--block', 'blockName')
        .help('имя блока (обязательный параметр)')
        .set()
        .end()
    .option('-e', '--elem', 'elemName')
        .help('имя элемента')
        .set()
        .end()
    .option('-v', '--val', 'modVal')
        .help('значения модификатора')
        .push()
        .end()
    .action(function(options) {
        if (! options.blockName) {
            parser.print('Пропущен обязательный параметр имени блока');
            parser.exit(1);
        }

        var level = new Level(options.levelDir),
            techs = bem_util.merge_techs(level, options);

        options.args.forEach(function(name) {
            var item = options.elemName ? 'elem' : 'block',
                args = (options.elemName ? [options.blockName, options.elemName] : [options.blockName])
                    .concat(name),
                vars = {
                    BlockName: options.blockName,
                    ElemName: options.elemName,
                    ModName: name
                };

            if (options.modVal.length) {
                options.modVal.forEach(function(val) {
                    var prefix = level.get(item + '-mod-val', args.concat(val));
                    prefix.dirname().mkdirs();
                    vars.ModVal = val;
                    for (var t in techs) {
                        techs[t].bemCreate(prefix, vars);
                    }
                    delete vars.ModVal;
                });
            } else {
                var prefix = level.get(item + '-mod', args);
                prefix.dirname().mkdirs();
                for (var t in techs) {
                    techs[t].bemCreate(prefix, vars);
                }
            }
        });
    })
    .helpful()
    .args('имена');
