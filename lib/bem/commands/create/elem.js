var bem_util = require('../../util'),
    Level = require('../../level').Level,
    parser = exports.parser = bem_util.bemCreateBemParser()
        .help('элемент блока');

parser.option('-b', '--block', 'blockName')
        .help('имя блока (обязательный параметр)')
        .set()
        .end()
    .action(function(options){
        if (! options.blockName) {
            parser.print('Пропущен обязательный параметр имени блока');
            parser.exit(1);
        }

        var level = new Level(options.levelDir),
            techs = bem_util.mergeTechs(level, options);

        options.args.forEach(function(name) {
            var prefix = level.get('elem', [options.blockName, name]);
            prefix.dirname().mkdirs();
            for (var t in techs) {
                techs[t].bemCreate(prefix, {
                    BlockName: options.blockName,
                    ElemName: name
                });
            }
        });
    })
    .helpful()
    .args('имена');
