var fs = require('file'),
    Level = require('../../level').Level,
    Tech = require('../../tech').Tech,
    parser = exports.parser = (new (require('args').Parser)())
        .help('блок');

parser.option('-l', '--level', 'levelDir')
        .help('директория уровня переопределения, по умолчанию текущая')
        .def(fs.cwdPath().join('/'))
        .set()
        .validate(function (d) { return fs.path(d).join('/') })
        .end()
    .option('-t', '--add-tech', 'addTech')
        .help('добавить технологию')
        .push()
        .end()
    .option('-T', '--force-tech', 'forceTech')
        .help('использовать только эту технологию')
        .push()
        .end()
    .option('-n', '--no-tech', 'noTech')
        .help('исключить технологию из использования')
        .push()
        .end()
    .action(function(options){
        var level = new Level(options.levelDir),
            techs = options.forceTech.length? {} : level.techs;

        options.forceTech.concat(options.addTech).forEach(function(t){
            !techs[t] && (techs[t] = new Tech(t));
        });

        options.noTech.forEach(function(t){ delete techs[t] });

        options.args.forEach(function(name){
            var prefix = options.levelDir.join(level['get-block'](name));
            prefix.dirname().mkdirs();
            for (var t in techs) techs[t].bemCreate(prefix);
        });
    })
    .helpful()
    .args('имена');
