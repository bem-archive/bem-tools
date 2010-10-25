var bemUtil = require('../../util'),
    sys = require('sys'),
    fs = require('fs'),
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

                console.log('-0-0-0-0-0-000000000000000');
                console.log(techs);
            args.names.forEach(function (name) {
                var prefix = level.get('block', [name]);
                try {
                    fs.mkdirSync(myPath.dirname(prefix), 0777);
                } catch(ignore) { console.log(ignore);}
                for (var t in techs)
                    techs[t].bemCreate(prefix, { BlockName: name });
            });
        });
};
