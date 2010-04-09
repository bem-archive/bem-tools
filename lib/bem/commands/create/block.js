var bem_util = require('../../util'),
    Level = require('../../level').Level,
    parser = exports.parser = bem_util.bemCreateBemParser()
        .help('блок');

parser.action(function (options) {
        var level = new Level(options.levelDir),
            techs = bem_util.mergeTechs(level, options);

        options.args.forEach(function (name) {
            var prefix = level.get('block', [name]);
            prefix.dirname().mkdirs();
            for (var t in techs) {
                techs[t].bemCreate(prefix, {BlockName: name});
            }
        });
    })
    .helpful()
    .args('имена');
