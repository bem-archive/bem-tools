var fs = require('file');

exports.bemCreateParser = function () {
    var Tech = require('./tech').Tech,
        parser = (new (require('args').Parser)());

    parser.option('-t', '--add-tech', 'addTech')
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
        .end();

    return parser;
};

exports.bemCreateBemParser = function() {
    return exports.bemCreateParser()
        .option('-l', '--level', 'levelDir')
            .help('директория уровня переопределения, по умолчанию текущая')
            .def(fs.cwdPath().join('/'))
            .set()
            .validate(function (d) {
                return fs.path(d).join('/');
            })
            .end();
};

exports.mergeTechs = function (level, options) {
    // NOTE: если при создании блока/элемента/модификатора
    // указали --force-tech <name> или --no-tech, и в level.js
    // определена технология с таким именем/файлом на диске,
    // нужно использовать именно её
    var techs = options.forceTech.length ? {} : level.techs;

    options.forceTech.concat(options.addTech).forEach(function(t) {
        var tech = level.getTech(t),
            name = tech.getTechName();
        !techs[name] && (techs[name] = tech);
    });

    options.noTech.forEach(function(t) {
        delete techs[level.getTech(t).getTechName()];
    });
    
    return techs;
};
