var bemUtil = require('../../util'),
    myPath = require('../../path'),
    Level = require('../../level').Level;

exports.OptParse = function() {
    return this
        .title('Блок.').helpful()
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
                techs = bemUtil.mergeTechs(level, opts);

            args.names.forEach(function (name) {
                var prefix = level.get('block', [name]);
                bemUtil.mkdir(myPath.dirname(prefix));
                for (var t in techs)
                    techs[t].bemCreate(prefix, { BlockName: name });
            });
        });
};
