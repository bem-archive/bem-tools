var bem_util = require('../../util'),
    Level = require('../../level').Level,
    parser = exports.parser = bem_util.bem_create_bem_parser()
        .help('блок');

parser.action(function (options) {
        var level = new Level(options.levelDir),
            techs = bem_util.merge_techs(level, options);

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
