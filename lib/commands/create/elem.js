var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level;

exports.OptParse = function() {
    return this
        .title('Элемент блока.').helpful()
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
                techs = bemUtil.mergeTechs(level, opts);

            args.names.forEach(function(name) {
                var prefix = level.get('elem', [opts.blockName, name]);
                bemUtil.mkdir(myPath.dirname(prefix));
                for (var t in techs)
                    techs[t].bemCreate(prefix, {
                        BlockName: opts.blockName,
                        ElemName: name
                    });
            });
        });
};
